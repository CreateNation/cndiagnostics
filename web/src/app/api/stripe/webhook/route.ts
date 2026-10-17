import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  appendEvent,
  getByStripeSession,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { syncPaidDiagnosticToGhl } from "@/lib/ghl-lead";
import { enqueueMetaPurchase } from "@/lib/meta/capi-purchase";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Webhook configuration missing" },
      { status: 500 },
    );
  }

  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const existing = await getByStripeSession(session.id);
    const submissionId = session.metadata?.submission_id;
    const submission = submissionId
      ? await getSubmission(submissionId)
      : existing;

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // Already past paid (e.g. quiz/report) — still ensure GHL + CAPI.
    if (existing && existing.status !== "pending_payment") {
      if (!existing.ghlOpportunityId) {
        try {
          await syncPaidDiagnosticToGhl(existing);
        } catch (err) {
          console.error(
            "[stripe-webhook] GHL sync failed",
            err instanceof Error ? err.message : err,
          );
        }
      }
      const latest = (await getSubmission(existing.id)) ?? existing;
      await enqueueMetaPurchase({ session, submission: latest });
      return NextResponse.json({ ok: true, idempotent: true });
    }

    // Keep landing-form name/email — do not replace with Stripe cardholder details.
    const updated = await updateSubmission(submission.id, {
      status: "paid",
      stripeSessionId: session.id,
      email: submission.email || session.customer_details?.email || null,
      name: submission.name,
      clientReportToken: submission.clientReportToken ?? nanoid(24),
      advisorReportToken: submission.advisorReportToken ?? nanoid(32),
    });
    await appendEvent(submission.id, "purchase_completed", {
      stripe_session_id: session.id,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
      event_id: `purchase_${session.id}`,
    });

    try {
      await syncPaidDiagnosticToGhl(updated);
    } catch (err) {
      console.error(
        "[stripe-webhook] GHL sync failed (paid status kept)",
        err instanceof Error ? err.message : err,
      );
    }

    const latest = (await getSubmission(submission.id)) ?? updated;
    await enqueueMetaPurchase({ session, submission: latest });
  }

  return NextResponse.json({ ok: true });
}

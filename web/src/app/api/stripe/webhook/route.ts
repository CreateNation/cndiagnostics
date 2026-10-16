import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getStripe } from "@/lib/stripe";
import {
  appendEvent,
  getByStripeSession,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { syncPaidDiagnosticToGhl } from "@/lib/ghl-lead";

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

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: { submission_id?: string };
      customer_details?: { email?: string; name?: string };
      amount_total?: number | null;
      currency?: string | null;
    };

    const existing = await getByStripeSession(session.id);
    if (existing?.status === "report_ready") {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    // Already marked paid (e.g. success redirect) — still ensure opportunity exists.
    if (existing?.status === "paid") {
      if (!existing.ghlOpportunityId) {
        await syncPaidDiagnosticToGhl(existing);
      }
      return NextResponse.json({ ok: true, idempotent: true });
    }

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
      // Planned Meta CAPI dedupe key (browser GTM should use the same):
      // event_id: `purchase_${session.id}`
    });

    await syncPaidDiagnosticToGhl(updated);
  }

  return NextResponse.json({ ok: true });
}

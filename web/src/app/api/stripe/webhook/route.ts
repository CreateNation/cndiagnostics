import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getStripe } from "@/lib/stripe";
import {
  appendEvent,
  getByStripeSession,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { pushToGhl } from "@/lib/ghl";

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
  const raw = await req.text();

  let event;
  try {
    if (secret && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, secret);
    } else {
      event = JSON.parse(raw);
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: { submission_id?: string };
      customer_details?: { email?: string; name?: string };
    };

    const existing = await getByStripeSession(session.id);
    if (existing?.status === "report_ready" || existing?.status === "paid") {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    const submissionId = session.metadata?.submission_id;
    const submission = submissionId
      ? await getSubmission(submissionId)
      : existing;

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    await updateSubmission(submission.id, {
      status: "paid",
      stripeSessionId: session.id,
      email: session.customer_details?.email ?? submission.email,
      name: session.customer_details?.name ?? submission.name,
      clientReportToken: submission.clientReportToken ?? nanoid(24),
      advisorReportToken: submission.advisorReportToken ?? nanoid(32),
    });
    await appendEvent(submission.id, "purchase_completed");

    await pushToGhl({
      event: "purchase_completed",
      submission_id: submission.id,
      email: session.customer_details?.email ?? submission.email,
      name: session.customer_details?.name ?? submission.name,
      fields: {
        cnm_diag_submission_id: submission.id,
      },
      contactFacingSafe: true,
    });
  }

  return NextResponse.json({ ok: true });
}

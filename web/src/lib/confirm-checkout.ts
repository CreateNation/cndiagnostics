import { nanoid } from "nanoid";
import { getStripe } from "@/lib/stripe";
import {
  appendEvent,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { syncPaidDiagnosticToGhl } from "@/lib/ghl-lead";
import type { Submission } from "@/lib/types";

const PAID_STATUSES = new Set([
  "paid",
  "quiz_in_progress",
  "quiz_completed",
  "report_generating",
  "report_ready",
  "report_failed",
]);

export async function confirmCheckoutSession(
  submissionId: string,
  sessionId: string,
): Promise<Submission | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const submission = await getSubmission(submissionId);
  if (!submission) return null;
  if (PAID_STATUSES.has(submission.status)) return submission;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid" && session.status !== "complete") {
    return submission;
  }

  if (
    session.metadata?.submission_id &&
    session.metadata.submission_id !== submissionId
  ) {
    return submission;
  }

  // Keep landing-form name/email as source of truth — never overwrite with
  // Stripe card billing details (often a different cardholder name).
  const updated = await updateSubmission(submissionId, {
    status: "paid",
    stripeSessionId: session.id,
    email:
      submission.email ||
      session.customer_details?.email ||
      session.customer_email ||
      null,
    name: submission.name,
    clientReportToken: submission.clientReportToken ?? nanoid(24),
    advisorReportToken: submission.advisorReportToken ?? nanoid(32),
  });

  await appendEvent(submissionId, "purchase_completed", {
    mode: "checkout_redirect",
  });

  await syncPaidDiagnosticToGhl(updated);

  return (await getSubmission(submissionId)) ?? updated;
}

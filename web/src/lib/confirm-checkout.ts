import { nanoid } from "nanoid";
import { getStripe } from "@/lib/stripe";
import {
  appendEvent,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { pushToGhl } from "@/lib/ghl";
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

  const updated = await updateSubmission(submissionId, {
    status: "paid",
    stripeSessionId: session.id,
    email:
      session.customer_details?.email ??
      session.customer_email ??
      submission.email,
    name: session.customer_details?.name ?? submission.name,
    clientReportToken: submission.clientReportToken ?? nanoid(24),
    advisorReportToken: submission.advisorReportToken ?? nanoid(32),
  });

  await appendEvent(submissionId, "purchase_completed", {
    mode: "checkout_redirect",
  });

  await pushToGhl({
    event: "purchase_completed",
    submission_id: submissionId,
    email: updated.email,
    name: updated.name,
    fields: { cnm_diag_submission_id: submissionId },
    contactFacingSafe: true,
  });

  return updated;
}

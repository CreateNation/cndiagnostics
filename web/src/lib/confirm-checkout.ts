import { nanoid } from "nanoid";
import { getStripe } from "@/lib/stripe";
import {
  appendEvent,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { syncPaidDiagnosticToGhl } from "@/lib/ghl-lead";
import { enqueueMetaPurchase } from "@/lib/meta/capi-purchase";
import type { Submission } from "@/lib/types";

const PAID_STATUSES = new Set([
  "paid",
  "quiz_in_progress",
  "quiz_completed",
  "report_generating",
  "report_ready",
  "report_failed",
]);

/**
 * Verify Stripe session is paid, mark submission paid, sync GHL, enqueue Meta CAPI.
 * Meta failures never block paid status / quiz / GHL. Already-paid submissions
 * still enqueue CAPI if delivery was never sent (deduped by purchase_${session.id}).
 */
export async function confirmCheckoutSession(
  submissionId: string,
  sessionId: string,
): Promise<Submission | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const submission = await getSubmission(submissionId);
  if (!submission) return null;

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

  let updated = submission;

  if (!PAID_STATUSES.has(submission.status)) {
    // Keep landing-form name/email as source of truth — never overwrite with
    // Stripe card billing details (often a different cardholder name).
    updated = await updateSubmission(submissionId, {
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
      stripe_session_id: session.id,
    });

    try {
      await syncPaidDiagnosticToGhl(updated);
    } catch (err) {
      console.error(
        "[confirm-checkout] GHL sync failed (paid status kept)",
        err instanceof Error ? err.message : err,
      );
    }

    updated = (await getSubmission(submissionId)) ?? updated;
  }

  // Meta CAPI — independent of GHL; enqueue even when already paid.
  await enqueueMetaPurchase({ session, submission: updated });

  return updated;
}

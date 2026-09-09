import {
  appendEvent,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { sendInternalReportEmail, sendReportEmail } from "@/lib/email";

export async function ensureReportEmailSent(submissionId: string): Promise<{
  sent: boolean;
  mode: string;
  alreadySent?: boolean;
  error?: string;
  to?: string;
}> {
  const submission = await getSubmission(submissionId);
  if (!submission?.report || !submission.scoring || !submission.clientReportToken) {
    return { sent: false, mode: "none", error: "Report not ready" };
  }

  const to = submission.email;
  if (!to) {
    return { sent: false, mode: "none", error: "No recipient email" };
  }

  if (submission.reportEmailSentAt) {
    return {
      sent: true,
      mode: "already_sent",
      alreadySent: true,
      to,
    };
  }

  const result = await sendReportEmail({
    to,
    name: submission.name,
    submissionId: submission.id,
    clientToken: submission.clientReportToken,
    scoring: submission.scoring,
    report: submission.report,
  });

  await appendEvent(submissionId, "report_email_attempted", result);

  if (result.sent) {
    await updateSubmission(submissionId, {
      reportEmailSentAt: new Date().toISOString(),
    });
    await appendEvent(submissionId, "report_email_sent", {
      mode: result.mode,
      to,
    });
  }

  return { ...result, to };
}

/** Full (unlocked) PDF to the CNM team inbox. */
export async function ensureInternalReportEmailSent(submissionId: string): Promise<{
  sent: boolean;
  mode: string;
  alreadySent?: boolean;
  skipped?: boolean;
  error?: string;
  to?: string;
}> {
  const submission = await getSubmission(submissionId);
  if (
    !submission?.report ||
    !submission.scoring ||
    !submission.advisorReportToken ||
    !submission.clientReportToken
  ) {
    return { sent: false, mode: "none", error: "Report not ready" };
  }

  if (submission.internalReportEmailSentAt) {
    return {
      sent: true,
      mode: "already_sent",
      alreadySent: true,
      to: process.env.INTERNAL_REPORT_EMAIL || undefined,
    };
  }

  const result = await sendInternalReportEmail({
    submissionId: submission.id,
    name: submission.name,
    email: submission.email,
    phone: submission.phone,
    clientToken: submission.clientReportToken,
    advisorToken: submission.advisorReportToken,
    scoring: submission.scoring,
    report: submission.report,
  });

  await appendEvent(submissionId, "internal_report_email_attempted", result);

  if (result.skipped) {
    return result;
  }

  if (result.sent) {
    await updateSubmission(submissionId, {
      internalReportEmailSentAt: new Date().toISOString(),
    });
    await appendEvent(submissionId, "internal_report_email_sent", {
      mode: result.mode,
      to: result.to,
    });
  }

  return result;
}

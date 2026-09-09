import {
  appendEvent,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { sendReportEmail } from "@/lib/email";

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

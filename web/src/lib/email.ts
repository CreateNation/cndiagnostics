import type { ClientReport, ScoringResult } from "./types";
import { absoluteUrl, bookingUrl } from "./urls";
import {
  isGhlApiConfigured,
  isGhlEmailConfigured,
  sendGhlEmail,
  upsertGhlContact,
} from "./ghl";

function buildReportEmailHtml(input: {
  name: string | null;
  stageName: string;
  reportUrl: string;
  cta: ScoringResult["cta"];
}): string {
  const greeting = input.name ? `Hi ${input.name.split(" ")[0]},` : "Hi,";
  const booking =
    input.cta === "book_call"
      ? `<p style="margin:24px 0 0;">Ready to close the gap? <a href="${bookingUrl()}" style="color:#e44336;">Book your strategy call</a>.</p>`
      : `<p style="margin:24px 0 0;color:#667070;">We'll send practical growth resources next — a strategy call isn't the best next step at your current stage.</p>`;

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f3f1;font-family:Arial,Helvetica,sans-serif;color:#0e0e0e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f3f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#121212;padding:28px 28px 24px;">
              <p style="margin:0;color:#e44336;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Create Nation</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:28px;line-height:1.15;">Your Growth Diagnostic is ready</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.55;">${greeting}</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.55;">
                Your personalized Business Growth Diagnostic is ready. We scored your funnel across five dimensions and identified your current stage:
                <strong>${input.stageName}</strong>.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${input.reportUrl}" style="display:inline-block;background:#e44336;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
                  Open my report
                </a>
              </p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:#667070;">
                Or copy this link:<br/>
                <a href="${input.reportUrl}" style="color:#e44336;word-break:break-all;">${input.reportUrl}</a>
              </p>
              ${booking}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-size:12px;color:#667070;">
              Create Nation · Bridging the gap between creativity and results
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Deliver the client report email through GoHighLevel when configured.
 */
export async function sendReportEmail(input: {
  to: string;
  name: string | null;
  submissionId: string;
  clientToken: string;
  scoring: ScoringResult;
  report: ClientReport;
}): Promise<{ sent: boolean; mode: string; error?: string; contactId?: string }> {
  const reportUrl = absoluteUrl(`/report/${input.clientToken}`);
  const subject = `Your Create Nation Growth Diagnostic — ${input.scoring.stageName}`;
  const html = buildReportEmailHtml({
    name: input.name,
    stageName: input.scoring.stageName,
    reportUrl,
    cta: input.scoring.cta,
  });

  if (isGhlEmailConfigured()) {
    const upsert = await upsertGhlContact({
      email: input.to,
      name: input.name,
      tags: ["Diagnostic Report Ready"],
      fields: {
        cnm_diag_stage: input.scoring.stageName,
        cnm_diag_report_url: reportUrl,
        cnm_diag_cta: input.scoring.cta,
        cnm_diag_submission_id: input.submissionId,
      },
    });

    if (!upsert.contactId) {
      return {
        sent: false,
        mode: "ghl_api",
        error: upsert.error || "Could not upsert GHL contact",
      };
    }

    const email = await sendGhlEmail({
      contactId: upsert.contactId,
      to: input.to,
      subject,
      html,
      text: `Your Growth Diagnostic is ready: ${reportUrl}`,
    });

    if (!email.sent) {
      return {
        sent: false,
        mode: "ghl_api",
        contactId: upsert.contactId,
        error: email.error,
      };
    }

    return {
      sent: true,
      mode: "ghl_api",
      contactId: upsert.contactId,
    };
  }

  // Webhook / contact-sync mode: CRM already receives `client_report_ready`
  // from submit. A GHL workflow on that event should send the email.
  if (process.env.GHL_WEBHOOK_URL) {
    return {
      sent: true,
      mode: "ghl_webhook",
    };
  }

  if (isGhlApiConfigured()) {
    const upsert = await upsertGhlContact({
      email: input.to,
      name: input.name,
      tags: ["Diagnostic Report Ready"],
      fields: {
        cnm_diag_stage: input.scoring.stageName,
        cnm_diag_report_url: reportUrl,
        cnm_diag_cta: input.scoring.cta,
        cnm_diag_submission_id: input.submissionId,
      },
    });

    return {
      sent: false,
      mode: "ghl_contact_only",
      contactId: upsert.contactId ?? undefined,
      error:
        "Contact synced to GHL. Set GHL_EMAIL_FROM to send email via API, or GHL_WEBHOOK_URL + a Report Ready workflow.",
    };
  }

  console.info("[email stub] would send report", {
    to: input.to,
    stage: input.scoring.stageName,
    reportUrl,
    submissionId: input.submissionId,
  });

  return {
    sent: false,
    mode: "stub",
    error:
      "GoHighLevel not configured. Set GHL_API_KEY, GHL_LOCATION_ID, and GHL_EMAIL_FROM (or GHL_WEBHOOK_URL).",
  };
}

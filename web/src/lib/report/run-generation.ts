import {
  appendEvent,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { generateClientReport } from "@/lib/report/generate";
import { ensureReportEmailSent } from "@/lib/report-email";
import { syncDiagnosticLeadToGhl } from "@/lib/ghl-lead";
import { absoluteUrl } from "@/lib/urls";
import type { AdvisorIntel } from "@/lib/types";

/**
 * Build report + sync GHL + email for a submission already marked report_generating.
 * Safe to call more than once (no-ops if already report_ready).
 */
export async function runReportGeneration(submissionId: string): Promise<{
  ok: boolean;
  reportUrl?: string;
  cta?: string;
  stageName?: string;
  error?: string;
}> {
  const submission = await getSubmission(submissionId);
  if (!submission) {
    return { ok: false, error: "Not found" };
  }

  if (submission.status === "report_ready" && submission.report) {
    return {
      ok: true,
      reportUrl: absoluteUrl(`/report/${submission.clientReportToken}`),
      cta: submission.scoring?.cta,
      stageName: submission.scoring?.stageName,
    };
  }

  if (
    submission.status !== "report_generating" &&
    submission.status !== "quiz_completed" &&
    submission.status !== "report_failed"
  ) {
    return { ok: false, error: "Submission is not ready for generation" };
  }

  if (!submission.scoring || !Object.keys(submission.answers).length) {
    return { ok: false, error: "Submission incomplete" };
  }

  await updateSubmission(submissionId, { status: "report_generating" });

  try {
    const report = await generateClientReport({
      answers: submission.answers,
      scoring: submission.scoring,
      name: submission.name,
      email: submission.email,
    });

    const scoring = submission.scoring;
    const advisorIntel: AdvisorIntel = {
      band: scoring.band,
      urgency: scoring.urgency,
      objection: scoring.objection,
      spend: scoring.spend,
      team: scoring.team,
      activities: scoring.activities,
      confidence: scoring.confidence,
      rawAnswers: submission.answers,
      flags: scoring.flags,
      contradictions: scoring.contradictions,
    };

    const ready = await updateSubmission(submissionId, {
      status: "report_ready",
      report,
      advisorIntel,
    });

    await appendEvent(submissionId, "client_report_ready");
    await appendEvent(submissionId, "advisor_report_ready");

    const ghlSync = await syncDiagnosticLeadToGhl(ready);
    await appendEvent(submissionId, "ghl_lead_synced", {
      contactId: ghlSync.contactId,
      opportunityId: ghlSync.opportunityId,
      error: ghlSync.error ?? null,
    });

    await ensureReportEmailSent(submissionId);

    return {
      ok: true,
      reportUrl: absoluteUrl(`/report/${ready.clientReportToken}`),
      cta: scoring.cta,
      stageName: scoring.stageName,
    };
  } catch (err) {
    console.error("[report generation]", err);
    await updateSubmission(submissionId, { status: "report_failed" });
    await appendEvent(submissionId, "report_generation_failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Report generation failed",
    };
  }
}

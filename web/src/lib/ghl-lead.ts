import { QUESTIONS } from "./questions";
import type {
  Answers,
  AnswerValue,
  ClientReport,
  ScoringResult,
  Submission,
} from "./types";
import { normalizeReportPages } from "./report/normalize";
import { absoluteUrl } from "./urls";
import {
  addGhlContactNote,
  buildGhlFields,
  fireGhlWebhook,
  isGhlApiConfigured,
  upsertGhlContact,
  upsertGhlOpportunity,
} from "./ghl";
import { updateSubmission } from "./store";

function formatAnswerValue(
  value: AnswerValue | undefined,
  options?: { value: string; label: string }[],
): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value
      .map((v) => options?.find((o) => o.value === v)?.label ?? String(v))
      .join(", ");
  }
  const asString = String(value);
  return options?.find((o) => o.value === asString)?.label ?? asString;
}

export function formatAnswersTranscript(answers: Answers): string {
  return QUESTIONS.map((q) => {
    const formatted = formatAnswerValue(answers[q.id], q.options);
    return `${q.id}. ${q.prompt}\n→ ${formatted}`;
  }).join("\n\n");
}

function buildLeadNote(input: {
  submission: Submission;
  scoring: ScoringResult;
  report: ClientReport;
  reportUrl: string;
  pdfUrl: string;
  advisorUrl: string;
}): string {
  const pages = normalizeReportPages(input.report.pages, input.scoring);
  const dims = Object.entries(input.scoring.dimensions)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(" | ");

  const answers = formatAnswersTranscript(input.submission.answers);

  return [
    "CNM BUSINESS GROWTH DIAGNOSTIC — LEAD SUMMARY",
    `Submission: ${input.submission.id}`,
    `Name: ${input.submission.name ?? "—"}`,
    `Email: ${input.submission.email ?? "—"}`,
    `Generated: ${input.report.generatedAt} (${input.report.generator})`,
    "",
    "RESULTS",
    `Stage: ${input.scoring.stageName}`,
    `Band: ${input.scoring.band} | CTA: ${input.scoring.cta} | Confidence: ${input.scoring.confidence}`,
    `Urgency: ${input.scoring.urgency} | Objection: ${input.scoring.objection ?? "—"}`,
    `Spend: ${input.scoring.spend ?? "—"} | Team: ${input.scoring.team ?? "—"}`,
    `Dimensions: ${dims}`,
    `Primary bottleneck: ${pages.bottleneck.title}`,
    "",
    "REPORT LINKS",
    `Client report: ${input.reportUrl}`,
    `PDF: ${input.pdfUrl}`,
    `Advisor (internal): ${input.advisorUrl}`,
    "",
    "QUIZ ANSWERS",
    answers,
    "",
    "REPORT HIGHLIGHTS",
    `Stage evidence: ${pages.stage.evidence}`,
    `Bottleneck: ${pages.bottleneck.explanation}`,
    `Leak: ${pages.leak.diagnosis}`,
    `Next step: ${pages.nextStep.headline} — ${pages.nextStep.body}`,
  ].join("\n");
}

/**
 * Upsert the contact as a GHL lead with diagnostic fields, full Q&A + report note,
 * and fire workflow webhooks.
 */
export async function syncDiagnosticLeadToGhl(
  submission: Submission,
): Promise<{
  contactId: string | null;
  opportunityId: string | null;
  error?: string;
}> {
  if (!submission.email || !submission.scoring || !submission.report) {
    return {
      contactId: null,
      opportunityId: null,
      error: "Submission incomplete for GHL sync",
    };
  }
  if (!isGhlApiConfigured() && !process.env.GHL_WEBHOOK_URL) {
    return {
      contactId: null,
      opportunityId: null,
      error: "GHL not configured",
    };
  }

  const scoring = submission.scoring;
  const reportUrl = absoluteUrl(`/report/${submission.clientReportToken}`);
  const pdfUrl = absoluteUrl(`/api/report/${submission.clientReportToken}/pdf`);
  const advisorUrl = absoluteUrl(`/advisor/${submission.advisorReportToken}`);

  const answersTranscript = formatAnswersTranscript(submission.answers);
  const pages = normalizeReportPages(submission.report.pages, scoring);

  const fields = {
    ...buildGhlFields(submission, scoring, {
      client: reportUrl,
      advisor: advisorUrl,
    }),
    cnm_diag_pdf_url: pdfUrl,
    cnm_diag_bottleneck: pages.bottleneck.title,
    cnm_diag_industry: formatAnswerValue(
      submission.answers.Q1,
      QUESTIONS.find((q) => q.id === "Q1")?.options,
    ),
    cnm_diag_answers: answersTranscript.slice(0, 50000),
    cnm_diag_report_summary: [
      `Stage: ${scoring.stageName}`,
      `Bottleneck: ${pages.bottleneck.title}`,
      `CTA: ${scoring.cta}`,
      `Report: ${reportUrl}`,
      `PDF: ${pdfUrl}`,
    ].join("\n"),
  };

  const tags = [
    "CNM Diagnostic Lead",
    "Diagnostic Completed",
    "Diagnostic Report Ready",
    `Stage ${scoring.stageName}`,
    scoring.cta === "book_call" ? "CTA Book Call" : "CTA Email Nurture",
    `Band ${scoring.band}`,
  ];

  let contactId: string | null = submission.ghlContactId;
  let opportunityId: string | null = submission.ghlOpportunityId;
  let error: string | undefined;

  if (isGhlApiConfigured()) {
    const upsert = await upsertGhlContact({
      email: submission.email,
      name: submission.name,
      phone: submission.phone,
      tags,
      fields,
      type: "lead",
    });
    contactId = upsert.contactId ?? contactId;
    if (upsert.error) {
      error = upsert.error;
      console.error("[GHL] lead upsert failed", upsert.error);
    }

    if (contactId) {
      const note = buildLeadNote({
        submission,
        scoring,
        report: submission.report,
        reportUrl,
        pdfUrl,
        advisorUrl,
      });
      const noteResult = await addGhlContactNote({
        contactId,
        body: note,
      });
      if (noteResult.error) {
        console.error("[GHL] lead note failed", noteResult.error);
      }

      const opportunityName = [
        submission.name || submission.email,
        "—",
        "CNM Diagnostic",
        `(${scoring.stageName})`,
      ].join(" ");

      const opportunity = await upsertGhlOpportunity({
        contactId,
        name: opportunityName,
        cta: scoring.cta,
        existingOpportunityId: opportunityId,
      });
      opportunityId = opportunity.opportunityId ?? opportunityId;
      if (opportunity.error) {
        error = error ? `${error}; ${opportunity.error}` : opportunity.error;
        console.error("[GHL] opportunity sync failed", opportunity.error);
      }
    }

    await updateSubmission(submission.id, {
      ghlContactId: contactId,
      ghlOpportunityId: opportunityId,
    });
  }

  // Keep webhook events for GHL workflows (email nurture / booking branches).
  await fireGhlWebhook({
    event: "client_report_ready",
    submission_id: submission.id,
    email: submission.email,
    name: submission.name,
    fields: {
      cnm_diag_stage: scoring.stageName,
      cnm_diag_report_url: reportUrl,
      cnm_diag_pdf_url: pdfUrl,
      cnm_diag_cta: scoring.cta,
      cnm_diag_submission_id: submission.id,
      cnm_diag_bottleneck: pages.bottleneck.title,
    },
    contactFacingSafe: true,
  });

  await fireGhlWebhook({
    event: "advisor_report_ready",
    submission_id: submission.id,
    email: submission.email,
    name: submission.name,
    fields,
    contactFacingSafe: false,
  });

  return { contactId, opportunityId, error };
}

import type { Answers, ClientReport, ReportPages, ScoringResult } from "../types";
import { STAGES } from "../stages";
import { weakestDimension } from "../scoring";

const DIMENSION_LABELS: Record<string, string> = {
  audience: "Audience & Positioning",
  offer: "Offer Strength",
  funnel: "Funnel & Conversion",
  content: "Content & Demand Generation",
  systems: "Marketing Systems & Tracking",
};

export const REPORT_SYSTEM_PROMPT = `You are CNM's Business Growth Diagnostic report writer for Create Nation Marketing (UAE).

Return ONLY valid JSON. No markdown fences. No commentary.

Use EXACTLY these top-level keys and shapes:
{
  "cover": { "businessName": string, "stageName": string, "date": string },
  "stage": { "stageName": string, "stageId": 1-6, "evidence": string, "confidence": "high"|"medium"|"low", "scopeBoundary": string },
  "scorecard": { "dimensions": { "audience": 0-100, "offer": 0-100, "funnel": 0-100, "content": 0-100, "systems": 0-100 }, "summary": string },
  "bottleneck": { "title": string, "explanation": string, "evidence": string[] },
  "strengthsRisks": { "strengths": string[], "risks": string[] },
  "leak": { "diagnosis": string, "leakPoints": string[] },
  "nextStage": { "milestone": string, "whatItLooksLike": string },
  "costOfStaying": { "narrative": string, "note": string },
  "priorityMatrix": { "now": string[], "next": string[], "later": string[], "avoid": string[] },
  "ninetyDayPath": { "weeks": [{ "label": string, "focus": string }], "assumptions": string },
  "quickWins": string[],
  "nextStep": { "cta": "book_call"|"email_nurture", "headline": string, "body": string }
}

Hard rules:
- Copy stageName, stageId, confidence, dimensions, and cta EXACTLY from the scoring input. Do not invent different values.
- cover.date must be a full human date (e.g. "7 September 2026"), never just a year.
- strengths/risks/evidence/leakPoints/priority arrays/quickWins must be plain strings, never objects.
- ninetyDayPath.weeks must contain exactly 3 items.
- Tone: direct, specific, consulting-grade. No hype. No guaranteed ROI.
- Scope boundary must include: "This is a preliminary marketing diagnostic, not a full operational or financial audit."
- Every paragraph must reference at least 2 concrete inputs from the user's answers.
- If cta is book_call: invite a strategy call; never mention Priority/Nurture/Self-Serve.
- If cta is email_nurture: email nurture only — NO call CTA.
- Never invent metrics. Never expose closer-only qualification language.`;

export function buildReportUserPayload(
  answers: Answers,
  scoring: ScoringResult,
  contact: { name: string | null; email: string | null },
) {
  return {
    schemaVersion: "1.0",
    contact,
    answers,
    scoring: {
      adjustedStage: scoring.adjustedStage,
      stageName: scoring.stageName,
      confidence: scoring.confidence,
      dimensions: scoring.dimensions,
      cta: scoring.cta,
      urgency: scoring.urgency,
      // band intentionally omitted from model client-facing context reminder
    },
    stageMeta: STAGES[scoring.adjustedStage],
    weakest: weakestDimension(scoring.dimensions),
    caseStudies: [] as { industry: string; result: string }[],
    instructions: {
      pageCount: 12,
      language: "en",
      currency: "AED",
    },
  };
}

export function mockReportPages(
  answers: Answers,
  scoring: ScoringResult,
  contact: { name: string | null; email: string | null },
): ReportPages {
  const weak = weakestDimension(scoring.dimensions);
  const stage = STAGES[scoring.adjustedStage];
  const industry = String(answers.Q1 ?? "your industry");
  const businessName = contact.name || "Your Business";
  const date = new Date().toLocaleDateString("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    cover: {
      businessName,
      stageName: scoring.stageName,
      date,
    },
    stage: {
      stageName: scoring.stageName,
      stageId: scoring.adjustedStage,
      evidence: `Based on your reported revenue band and how sales are currently closed, you sit in ${scoring.stageName} (${stage.revenueLabel}). Confidence: ${scoring.confidence}.`,
      confidence: scoring.confidence,
      scopeBoundary:
        "This is a preliminary marketing diagnostic, not a full operational or financial audit.",
    },
    scorecard: {
      dimensions: scoring.dimensions,
      summary: `Your weakest area right now is ${DIMENSION_LABELS[weak]} (${scoring.dimensions[weak]}/100), which is the primary constraint on moving past ${scoring.stageName}.`,
    },
    bottleneck: {
      title: stage.bottleneck,
      explanation: `At ${scoring.stageName}, the typical constraint is ${stage.bottleneck.toLowerCase()}. Your answers on ${DIMENSION_LABELS[weak]} and funnel clarity point to this as the binding constraint—not a generic marketing checklist.`,
      evidence: [
        `Revenue stage signal: ${stage.revenueLabel}`,
        `Weakest dimension: ${DIMENSION_LABELS[weak]} at ${scoring.dimensions[weak]}/100`,
        `Industry context: ${industry}`,
      ],
    },
    strengthsRisks: {
      strengths: Object.entries(scoring.dimensions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(
          ([k, v]) =>
            `${DIMENSION_LABELS[k]} scores ${v}/100 — protect and productize this advantage.`,
        ),
      risks: [
        `Staying in ${scoring.stageName} without fixing ${DIMENSION_LABELS[weak]} keeps growth founder-fragile.`,
        `Objection signal: ${scoring.objection ?? "unspecified"} — address this before scaling spend.`,
      ],
    },
    leak: {
      diagnosis: `The leak in your marketing-to-sales path is concentrated where ${DIMENSION_LABELS[weak]} and Funnel & Conversion (${scoring.dimensions.funnel}/100) intersect.`,
      leakPoints: [
        `Funnel documentation score implies drop-off visibility is limited.`,
        `Content/demand and systems scores suggest acquisition is not yet a closed loop.`,
      ],
    },
    nextStage: {
      milestone: stage.nextMilestone,
      whatItLooksLike: `Crossing into the next stage means ${stage.nextMilestone.toLowerCase()}, with marketing activities no longer depending on ad-hoc effort.`,
    },
    costOfStaying: {
      narrative: `Every month in ${scoring.stageName} without closing the ${DIMENSION_LABELS[weak]} gap compounds opportunity cost—missed compounding from a clearer offer, funnel, and tracking system.`,
      note: "Directional only — no fabricated AED figures.",
    },
    priorityMatrix: {
      now: [
        `Clarify the single offer tied to your most profitable customer type.`,
        `Map the prospect journey and name the largest drop-off stage.`,
      ],
      next: [
        `Align content and paid activity to one CTA.`,
        `Install revenue-linked tracking (CAC / CPL / ROI).`,
      ],
      later: [`Expand channels only after conversion math is stable.`],
      avoid: [
        `Scaling ad spend before the bottleneck is diagnosed.`,
        `Adding vanity content that only speaks to warm audiences.`,
      ],
    },
    ninetyDayPath: {
      weeks: [
        { label: "Days 1–30", focus: "Diagnose leak, lock ICP and offer framing." },
        { label: "Days 31–60", focus: "Install funnel process and tracking." },
        { label: "Days 61–90", focus: "Run one acquisition channel with measured conversion." },
      ],
      assumptions:
        "Assumes you can dedicate decision-maker time weekly; not a locked implementation plan.",
    },
    quickWins: [
      "Write a one-sentence differentiation answer and test it on the next 5 sales conversations.",
      "List every step from first touch to payment on one page.",
      "Pick one revenue metric (CPL or close rate) and track it this week.",
      "Pause any ad creative without a single clear CTA.",
      "Identify your top 20% most profitable clients and describe them in 5 traits.",
      "Book 30 minutes to review where leads go quiet after inquiry.",
      "Remove one service-list bullet from your offer page; replace with an outcome.",
    ],
    nextStep:
      scoring.cta === "book_call"
        ? {
            cta: "book_call",
            headline: "Book your strategy call",
            body: "Your report shows where the gap is. On a 20-minute call, we’ll walk through how CNM would close it for a business at your stage.",
          }
        : {
            cta: "email_nurture",
            headline: "Keep growing with CNM resources",
            body: "Based on your current stage, the best next step is practical growth resources by email—not a strategy call yet. We’ll stay useful until you’re ready for the next level.",
          },
  };
}

export function wrapClientReport(
  pages: ReportPages,
  generator: "claude" | "mock",
): ClientReport {
  return {
    generatedAt: new Date().toISOString(),
    generator,
    pages,
  };
}

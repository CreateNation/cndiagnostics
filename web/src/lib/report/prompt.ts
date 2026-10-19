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
- READABILITY (critical — users skim, they do not read essays):
  - Use short sentences. Prefer 8–16 words. Never stack long paragraphs.
  - Use plain words a busy UAE business owner understands. Avoid jargon like "constraint", "compounding", "productize", "founder-fragile", "acquisition loop" unless you explain in simple words.
  - evidence / explanation / diagnosis / narrative / summary / body: max 2 short sentences each.
  - strengths, risks, leakPoints, priority arrays, quickWins: max 8–14 words per item.
  - ninetyDayPath focus lines: one short sentence each.
  - Prefer concrete actions ("Fix your offer page CTA") over abstract analysis.
- Tone: direct, specific, friendly-professional. No hype. No guaranteed ROI.
- Scope boundary must include: "This is a preliminary marketing diagnostic, not a full operational or financial audit."
- Tie claims to the user's answers, but keep the wording simple.
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
      evidence: `You are in ${scoring.stageName} (${stage.revenueLabel}). We are ${scoring.confidence} sure based on your answers.`,
      confidence: scoring.confidence,
      scopeBoundary:
        "This is a preliminary marketing diagnostic, not a full operational or financial audit.",
    },
    scorecard: {
      dimensions: scoring.dimensions,
      summary: `${DIMENSION_LABELS[weak]} is your weakest score (${scoring.dimensions[weak]}/100). Fix this to move past ${scoring.stageName}.`,
    },
    bottleneck: {
      title: stage.bottleneck,
      explanation: `At ${scoring.stageName}, the usual stuck point is ${stage.bottleneck.toLowerCase()}. Your answers point here first.`,
      evidence: [
        `Stage: ${stage.revenueLabel}`,
        `Weakest: ${DIMENSION_LABELS[weak]} (${scoring.dimensions[weak]}/100)`,
        `Industry: ${industry}`,
      ],
    },
    strengthsRisks: {
      strengths: Object.entries(scoring.dimensions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([k, v]) => `${DIMENSION_LABELS[k]} is strong (${v}/100). Keep it.`),
      risks: [
        `Ignoring ${DIMENSION_LABELS[weak]} keeps you stuck in ${scoring.stageName}.`,
        `Main objection: ${scoring.objection ?? "unclear"} — fix before you spend more.`,
      ],
    },
    leak: {
      diagnosis: `Leads drop where ${DIMENSION_LABELS[weak]} meets your funnel (${scoring.dimensions.funnel}/100).`,
      leakPoints: [
        `You cannot see where people drop off clearly.`,
        `Marketing and sales are not one clear path yet.`,
      ],
    },
    nextStage: {
      milestone: stage.nextMilestone,
      whatItLooksLike: `Next stage means ${stage.nextMilestone.toLowerCase()}. Marketing stops being guesswork.`,
    },
    costOfStaying: {
      narrative: `Each month stuck in ${scoring.stageName} costs you time and missed sales. A clearer offer and funnel would help.`,
      note: "Estimate only — no made-up AED numbers.",
    },
    priorityMatrix: {
      now: [
        `Pick one clear offer for your best customers.`,
        `Write the steps from first contact to payment.`,
      ],
      next: [
        `Point all content and ads to one CTA.`,
        `Track cost per lead and close rate.`,
      ],
      later: [`Add new channels only after conversion is steady.`],
      avoid: [
        `Do not raise ad spend before you find the leak.`,
        `Skip content that only talks to people who already know you.`,
      ],
    },
    ninetyDayPath: {
      weeks: [
        { label: "Days 1–30", focus: "Find the leak. Lock who you sell to and what you sell." },
        { label: "Days 31–60", focus: "Build a simple funnel and start tracking." },
        { label: "Days 61–90", focus: "Run one channel and measure results." },
      ],
      assumptions: "Works if a decision-maker spends time each week. Not a fixed project plan.",
    },
    quickWins: [
      "Write one clear offer line. Test it in 5 sales chats.",
      "List every step from first click to payment.",
      "Pick one number (leads or close rate) and track it.",
      "Pause ads with no clear CTA.",
      "List 5 traits of your best clients.",
      "Find where leads go quiet after they ask.",
      "Replace one service bullet with a clear result.",
    ],
    nextStep:
      scoring.cta === "book_call"
        ? {
            cta: "book_call",
            headline: "Book your strategy call",
            body: "This report shows the gap. On a short call, we walk through how to close it.",
          }
        : {
            cta: "email_nurture",
            headline: "Keep growing with CNM resources",
            body: "At your stage, email tips are the better next step — not a call yet.",
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

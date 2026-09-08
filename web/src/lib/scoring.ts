import { QUESTIONS, getQuestion } from "./questions";
import { REVENUE_TO_STAGE, STAGES, clampStage } from "./stages";
import type {
  Answers,
  Confidence,
  DimensionKey,
  DimensionScores,
  QualificationBand,
  ScoringResult,
  StageId,
} from "./types";

const DIMENSION_WEIGHTS: Record<
  DimensionKey,
  { questionId: string; weight: number }[]
> = {
  audience: [
    { questionId: "Q6", weight: 0.35 },
    { questionId: "Q7", weight: 0.35 },
    { questionId: "Q8", weight: 0.3 },
  ],
  offer: [
    { questionId: "Q9", weight: 0.4 },
    { questionId: "Q10", weight: 0.3 },
    { questionId: "Q11", weight: 0.3 },
  ],
  funnel: [
    { questionId: "Q12", weight: 0.25 },
    { questionId: "Q13", weight: 0.25 },
    { questionId: "Q14", weight: 0.2 },
    { questionId: "Q15", weight: 0.3 },
  ],
  content: [
    { questionId: "Q16", weight: 0.35 },
    { questionId: "Q17", weight: 0.35 },
    { questionId: "Q18", weight: 0.3 },
  ],
  systems: [
    { questionId: "Q20", weight: 0.3 },
    { questionId: "Q21", weight: 0.3 },
    { questionId: "Q22", weight: 0.4 },
  ],
};

function optionScore(questionId: string, value: unknown): number | null {
  const q = getQuestion(questionId);
  if (!q?.options) return null;

  if (questionId === "Q21" && Array.isArray(value)) {
    const selected = value as string[];
    if (selected.includes("none") || selected.length === 0) return 0;
    if (selected.length === 1 && selected[0] === "referral-only") return 1;
    const count = selected.filter((v) => v !== "referral-only" && v !== "none").length;
    if (count >= 4) return 4;
    if (count === 3) return 3;
    if (count === 2) return 2;
    return 1;
  }

  const opt = q.options.find((o) => o.value === String(value));
  if (!opt || opt.score === undefined) return null;
  return opt.score;
}

function scoreDimension(key: DimensionKey, answers: Answers): number {
  const parts = DIMENSION_WEIGHTS[key];
  let total = 0;
  for (const { questionId, weight } of parts) {
    const raw = optionScore(questionId, answers[questionId]);
    const normalized = raw === null ? 0 : (raw / 4) * 100;
    total += normalized * weight;
  }
  return Math.round(total);
}

function classifyStage(answers: Answers): {
  primaryStage: StageId;
  adjustedStage: StageId;
  confidence: Confidence;
} {
  const revenue = String(answers.Q3 ?? "");
  const primaryStage = REVENUE_TO_STAGE[revenue];
  if (!primaryStage) {
    throw new Error("Q3 (revenue) is required for stage classification");
  }

  const q4 = String(answers.Q4 ?? "");
  let adjustedStage: StageId = primaryStage;
  let confidence: Confidence = "high";

  if (q4 === "0" && primaryStage >= 4) {
    adjustedStage = clampStage(primaryStage - 1);
    confidence = "medium";
  } else if (q4 === "4" && primaryStage <= 3) {
    adjustedStage = clampStage(primaryStage + 1);
    confidence = "medium";
  }

  return { primaryStage, adjustedStage, confidence };
}

function qualificationBand(
  adjustedStage: StageId,
  urgency: number,
): { band: QualificationBand; cta: "book_call" | "email_nurture" } {
  if (adjustedStage <= 3) {
    return { band: "Self-Serve", cta: "email_nurture" };
  }
  if (urgency >= 3) {
    return { band: "Priority", cta: "book_call" };
  }
  return { band: "Nurture", cta: "book_call" };
}

function detectContradictions(answers: Answers, stage: StageId): string[] {
  const flags: string[] = [];
  const q19 = String(answers.Q19 ?? "");
  const q20 = String(answers.Q20 ?? "");
  const q21 = answers.Q21;
  const q22 = String(answers.Q22 ?? "");
  const q13 = String(answers.Q13 ?? "");
  const q23 = String(answers.Q23 ?? "");
  const q24 = String(answers.Q24 ?? "");
  const q4 = String(answers.Q4 ?? "");

  if (stage === 1 && q19 === "over-20k") {
    flags.push("Pre-revenue with AED 20K+/mo agency spend");
  }
  if (stage >= 5 && q20 === "just-me" && q19 === "none") {
    flags.push("Stage 5/6 with solo founder and no agency — implausible scale");
  }
  if (q24 === "4" && q23 === "not-priority") {
    flags.push("Extremely urgent but objection is 'not a priority'");
  }
  if (
    Array.isArray(q21) &&
    q21.includes("none") &&
    q19 !== "none" &&
    q19 !== ""
  ) {
    flags.push("No marketing activities but active paid agency reported");
  }
  if (q22 === "4" && q13 === "0") {
    flags.push("Claims full revenue tracking but unknown lead drop-off");
  }
  if (q4 === "0" && stage === 6) {
    flags.push("Stage 6 revenue with founder still closing all sales");
  }

  const dimQuestions = QUESTIONS.filter((q) => q.role.includes("dimension_score"));
  const scores = dimQuestions.map((q) => optionScore(q.id, answers[q.id]));
  if (
    scores.every((s) => s === 4) &&
    stage === 1
  ) {
    flags.push("All-4s across dimensions with Stage 1 revenue");
  }

  const straightLine = scores.filter((s) => s !== null);
  if (
    straightLine.length >= 8 &&
    straightLine.every((s) => s === straightLine[0])
  ) {
    flags.push("Straight-lining detected across dimension answers");
  }

  return flags;
}

function confidenceOverrides(
  answers: Answers,
  base: Confidence,
  contradictions: string[],
): Confidence {
  if (!answers.Q3 || !answers.Q25) return "low";
  if (contradictions.some((c) => c.includes("implausible") || c.includes("Straight-lining"))) {
    return "low";
  }
  if (contradictions.length > 0 && base === "high") return "medium";
  return base;
}

export function scoreAnswers(answers: Answers): ScoringResult {
  if (!answers.Q3) {
    throw new Error("Q3 is required");
  }
  if (!answers.Q25) {
    throw new Error("Q25 (email) is required for delivery");
  }

  const { primaryStage, adjustedStage, confidence: baseConfidence } =
    classifyStage(answers);

  const dimensions: DimensionScores = {
    audience: scoreDimension("audience", answers),
    offer: scoreDimension("offer", answers),
    funnel: scoreDimension("funnel", answers),
    content: scoreDimension("content", answers),
    systems: scoreDimension("systems", answers),
  };

  const urgency = optionScore("Q24", answers.Q24) ?? 0;
  const { band, cta } = qualificationBand(adjustedStage, urgency);
  const contradictions = detectContradictions(answers, adjustedStage);
  const confidence = confidenceOverrides(answers, baseConfidence, contradictions);

  const activities = Array.isArray(answers.Q21)
    ? (answers.Q21 as string[])
    : [];

  const spendOpt = getQuestion("Q19")?.options?.find(
    (o) => o.value === String(answers.Q19),
  );
  const teamOpt = getQuestion("Q20")?.options?.find(
    (o) => o.value === String(answers.Q20),
  );
  const objectionOpt = getQuestion("Q23")?.options?.find(
    (o) => o.value === String(answers.Q23),
  );

  return {
    primaryStage,
    adjustedStage,
    stageName: STAGES[adjustedStage].name,
    confidence,
    dimensions,
    band,
    cta,
    urgency,
    objection: objectionOpt?.label ?? null,
    spend: spendOpt?.label ?? null,
    team: teamOpt?.label ?? null,
    activities,
    flags: contradictions,
    contradictions,
  };
}

export function weakestDimension(
  dimensions: DimensionScores,
): DimensionKey {
  return (Object.entries(dimensions) as [DimensionKey, number][]).sort(
    (a, b) => a[1] - b[1],
  )[0][0];
}

import type {
  Confidence,
  CtaType,
  DimensionScores,
  ReportPages,
  ScoringResult,
  StageId,
} from "../types";
import { STAGES } from "../stages";

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function formatObjectBullet(obj: Record<string, unknown>): string {
  const label =
    asString(obj.item) ||
    asString(obj.action) ||
    asString(obj.strength) ||
    asString(obj.risk) ||
    asString(obj.title) ||
    asString(obj.label) ||
    asString(obj.focus) ||
    asString(obj.name);

  const detail =
    asString(obj.detail) ||
    asString(obj.details) ||
    asString(obj.rationale) ||
    asString(obj.why) ||
    asString(obj.explanation) ||
    asString(obj.description) ||
    asString(obj.summary);

  if (label && detail) return `${label}: ${detail}`;
  return label || detail;
}

function coerceBullet(item: unknown): string {
  if (typeof item === "string") {
    const trimmed = item.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return coerceBullet(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (typeof item === "number") return String(item);
  if (item && typeof item === "object") {
    return formatObjectBullet(item as Record<string, unknown>);
  }
  return "";
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    const coerced = coerceBullet(value);
    return coerced ? [coerced] : [];
  }
  if (!Array.isArray(value)) return [];
  return value.map(coerceBullet).filter(Boolean);
}

function asDimensions(value: unknown): DimensionScores {
  const d = (value ?? {}) as Record<string, unknown>;
  const read = (key: string) => {
    const raw = d[key];
    if (typeof raw === "number") return raw;
    if (raw && typeof raw === "object") {
      const nested = raw as Record<string, unknown>;
      return Number(nested.score ?? nested.value ?? nested.points ?? 0);
    }
    return Number(raw ?? 0);
  };
  return {
    audience: read("audience"),
    offer: read("offer"),
    funnel: read("funnel"),
    content: read("content"),
    systems: read("systems"),
  };
}

function dimensionsLookEmpty(dims: DimensionScores): boolean {
  return Object.values(dims).every((v) => !v);
}

function normalizeCta(value: unknown, fallback?: CtaType): CtaType {
  if (value === "book_call" || value === "email_nurture") return value;
  return fallback ?? "email_nurture";
}

function normalizeWeeks(
  path: Record<string, unknown>,
): { label: string; focus: string }[] {
  const candidates = [
    path.weeks,
    path.phases,
    path.timeline,
    path.plan,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.map((w, i) => {
        const week = (w ?? {}) as Record<string, unknown>;
        const objectives = asStringArray(week.objectives ?? week.actions);
        return {
          label: asString(week.label || week.title || week.phase, `Phase ${i + 1}`),
          focus:
            asString(week.focus) ||
            objectives.join("; ") ||
            asString(week.summary || week.description),
        };
      });
    }
  }

  const blocks = [
    path.weeks1to4,
    path.weeks5to8,
    path.weeks9to12,
    path.month1,
    path.month2,
    path.month3,
    path.days1to30,
    path.days31to60,
    path.days61to90,
  ].filter(Boolean);

  return blocks.map((block, i) => {
    const b = (block ?? {}) as Record<string, unknown>;
    const objectives = asStringArray(b.objectives ?? b.actions);
    return {
      label: asString(b.title || b.label, `Phase ${i + 1}`),
      focus: asString(b.focus) || objectives.join("; ") || asString(b.summary),
    };
  });
}

function normalizePriority(
  matrix: Record<string, unknown>,
): ReportPages["priorityMatrix"] {
  const now = asStringArray(
    matrix.now ??
      matrix.highImpactQuickWins ??
      matrix.nowActions ??
      matrix.immediate ??
      matrix.priorityNow,
  );
  const next = asStringArray(
    matrix.next ??
      matrix.highImpactLongerTerm ??
      matrix.nextActions ??
      matrix.shortTerm ??
      matrix.priorityNext,
  );
  const later = asStringArray(
    matrix.later ??
      matrix.lowImpactQuickWins ??
      matrix.laterActions ??
      matrix.mediumTerm ??
      matrix.priorityLater,
  );
  const avoid = asStringArray(
    matrix.avoid ??
      matrix.lowImpactLongerTerm ??
      matrix.avoidActions ??
      matrix.doNot ??
      matrix.priorityAvoid,
  );

  return { now, next, later, avoid };
}

function pickRecord(
  pages: Record<string, unknown>,
  ...keys: string[]
): Record<string, unknown> {
  for (const key of keys) {
    const value = pages[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return {};
}

/**
 * Claude sometimes returns a richer alternate schema.
 * Normalize any AI JSON into the canonical ReportPages shape used by the UI.
 * When scoring is provided, stage / dimensions / CTA always win over model drift.
 */
export function normalizeReportPages(
  raw: unknown,
  scoring?: ScoringResult | null,
): ReportPages {
  const pages = (raw ?? {}) as Record<string, unknown>;
  const cover = pickRecord(pages, "cover");
  const stage = pickRecord(pages, "stage", "stagePage");
  const scorecard = pickRecord(pages, "scorecard", "dimensionScorecard");
  const bottleneck = pickRecord(pages, "bottleneck", "primaryBottleneck");
  const strengthsRisks = pickRecord(pages, "strengthsRisks", "strengthsAndRisks");
  const leak = pickRecord(pages, "leak", "funnelLeak", "whereTheLeakIs");
  const nextStage = pickRecord(pages, "nextStage", "nextLevel");
  const costOfStaying = pickRecord(pages, "costOfStaying", "costOfInaction");
  const priorityMatrix = pickRecord(pages, "priorityMatrix", "priorities", "actions");
  const ninetyDayPath = pickRecord(pages, "ninetyDayPath", "roadmap", "path90");
  const nextStep = pickRecord(pages, "nextStep", "ctaPage");

  const quickWinsRaw = pages.quickWins ?? pages.sevenDayWins;
  const quickWins = Array.isArray(quickWinsRaw)
    ? asStringArray(quickWinsRaw)
    : asStringArray((quickWinsRaw as Record<string, unknown> | undefined)?.wins);

  const modelDims = asDimensions(scorecard.dimensions);
  const dimensions =
    scoring && !dimensionsLookEmpty(scoring.dimensions)
      ? scoring.dimensions
      : modelDims;

  const stageMeta = scoring ? STAGES[scoring.adjustedStage] : null;
  const stageName =
    scoring?.stageName ||
    asString(stage.stageName) ||
    asString(cover.stageName) ||
    "Diagnostic";
  const stageId = (scoring?.adjustedStage ??
    Number(stage.stageId ?? 1)) as StageId;
  const confidence = (scoring?.confidence ||
    asString(stage.confidence, "medium")) as Confidence;

  const date = new Date().toLocaleDateString("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cta = normalizeCta(scoring?.cta ?? nextStep.cta, scoring?.cta);

  const evidence =
    asString(stage.evidence || stage.summary || stage.explanation) ||
    (stageMeta
      ? `Based on your answers, you are in ${stageMeta.name} (${stageMeta.revenueLabel}). Confidence: ${confidence}.`
      : "");

  const nextMilestone =
    asString(nextStage.milestone || nextStage.title) ||
    (stageMeta ? stageMeta.nextMilestone : "");
  const nextLooksLike =
    asString(
      nextStage.whatItLooksLike || nextStage.description || nextStage.summary,
    ) ||
    (stageMeta
      ? `Crossing into the next stage means ${stageMeta.nextMilestone.toLowerCase()}.`
      : "");

  let headline = asString(
    nextStep.headline || nextStep.title || nextStep.primaryMessage,
    cta === "book_call" ? "Book your strategy call" : "Keep growing with CNM resources",
  );
  let body = asString(
    nextStep.body ||
      nextStep.secondaryMessage ||
      nextStep.closingStatement ||
      nextStep.primaryMessage,
  );

  // Keep CTA copy consistent with qualification rules
  if (cta === "book_call") {
    if (/nurture|email list|not the next step/i.test(headline)) {
      headline = "Book your strategy call";
    }
    if (!body || /nurture|no call/i.test(body)) {
      body =
        "Your report shows where the gap is. On a 20-minute call, we’ll walk through how CNM would close it for a business at your stage.";
    }
  } else {
    if (/book.*call|strategy call/i.test(headline)) {
      headline = "Keep growing with CNM resources";
    }
    if (!body || /book.*call/i.test(body)) {
      body =
        "Based on your current stage, the best next step is practical growth resources by email—not a strategy call yet.";
    }
  }

  return {
    cover: {
      businessName: asString(
        cover.businessName || cover.name,
        "Your Business",
      ),
      stageName,
      date,
    },
    stage: {
      stageName,
      stageId: Number.isFinite(Number(stageId)) ? stageId : 1,
      evidence,
      confidence:
        confidence === "high" || confidence === "medium" || confidence === "low"
          ? confidence
          : "medium",
      scopeBoundary: asString(
        stage.scopeBoundary,
        "This is a preliminary marketing diagnostic, not a full operational or financial audit.",
      ),
    },
    scorecard: {
      dimensions,
      summary: asString(scorecard.summary),
    },
    bottleneck: {
      title: asString(
        bottleneck.title || bottleneck.bottleneckName,
        stageMeta?.bottleneck || "Primary bottleneck",
      ),
      explanation: asString(
        bottleneck.explanation || bottleneck.impact || bottleneck.whyNow,
      ),
      evidence: asStringArray(
        bottleneck.evidence ?? bottleneck.symptoms ?? bottleneck.evidencePoints,
      ),
    },
    strengthsRisks: {
      strengths: asStringArray(strengthsRisks.strengths),
      risks: asStringArray(strengthsRisks.risks),
    },
    leak: {
      diagnosis: asString(leak.diagnosis || leak.description || leak.leakName),
      leakPoints: asStringArray(
        leak.leakPoints ?? leak.evidencePoints ?? leak.symptoms,
      ),
    },
    nextStage: {
      milestone: nextMilestone,
      whatItLooksLike: nextLooksLike,
    },
    costOfStaying: {
      narrative: asString(
        costOfStaying.narrative ||
          costOfStaying.description ||
          costOfStaying.costContext,
      ),
      note: asString(
        costOfStaying.note,
        "Directional only — no fabricated AED figures.",
      ),
    },
    priorityMatrix: normalizePriority(priorityMatrix),
    ninetyDayPath: {
      weeks: normalizeWeeks(ninetyDayPath),
      assumptions: asString(
        ninetyDayPath.assumptions || ninetyDayPath.endOfSprintGoal,
      ),
    },
    quickWins: (() => {
      if (quickWins.length > 0) return quickWins;
      const fromPriority = normalizePriority(priorityMatrix).now;
      return fromPriority.slice(0, 7);
    })(),
    nextStep: {
      cta,
      headline,
      body,
    },
  };
}

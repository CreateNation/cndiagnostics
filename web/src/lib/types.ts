export type StageId = 1 | 2 | 3 | 4 | 5 | 6;
export type Confidence = "high" | "medium" | "low";
export type QualificationBand = "Priority" | "Nurture" | "Self-Serve";
export type CtaType = "book_call" | "email_nurture";

export type DimensionKey =
  | "audience"
  | "offer"
  | "funnel"
  | "content"
  | "systems";

export type AnswerValue = string | number | string[];

export type Answers = Record<string, AnswerValue>;

export type DimensionScores = Record<DimensionKey, number>;

export type ScoringResult = {
  primaryStage: StageId;
  adjustedStage: StageId;
  stageName: string;
  confidence: Confidence;
  dimensions: DimensionScores;
  band: QualificationBand;
  cta: CtaType;
  urgency: number;
  objection: string | null;
  spend: string | null;
  team: string | null;
  activities: string[];
  flags: string[];
  contradictions: string[];
};

export type SubmissionStatus =
  | "pending_payment"
  | "paid"
  | "quiz_in_progress"
  | "quiz_completed"
  | "report_generating"
  | "report_ready"
  | "report_failed";

export type Submission = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SubmissionStatus;
  email: string | null;
  name: string | null;
  phone: string | null;
  stripeSessionId: string | null;
  answers: Answers;
  scoring: ScoringResult | null;
  clientReportToken: string | null;
  advisorReportToken: string | null;
  report: ClientReport | null;
  advisorIntel: AdvisorIntel | null;
  reportEmailSentAt: string | null;
  ghlContactId: string | null;
  ghlOpportunityId: string | null;
  ninetyDayUnlockCode: string | null;
  ninetyDayUnlockedAt: string | null;
  events: FunnelEvent[];
};

export type FunnelEvent = {
  name: string;
  at: string;
  meta?: Record<string, unknown>;
};

export type ClientReport = {
  generatedAt: string;
  generator: "claude" | "mock";
  pages: ReportPages;
};

export type AdvisorIntel = {
  band: QualificationBand;
  urgency: number;
  objection: string | null;
  spend: string | null;
  team: string | null;
  activities: string[];
  confidence: Confidence;
  rawAnswers: Answers;
  flags: string[];
  contradictions: string[];
};

export type ReportPages = {
  cover: { businessName: string; stageName: string; date: string };
  stage: {
    stageName: string;
    stageId: StageId;
    evidence: string;
    confidence: Confidence;
    scopeBoundary: string;
  };
  scorecard: { dimensions: DimensionScores; summary: string };
  bottleneck: { title: string; explanation: string; evidence: string[] };
  strengthsRisks: {
    strengths: string[];
    risks: string[];
  };
  leak: { diagnosis: string; leakPoints: string[] };
  nextStage: { milestone: string; whatItLooksLike: string };
  costOfStaying: { narrative: string; note: string };
  priorityMatrix: {
    now: string[];
    next: string[];
    later: string[];
    avoid: string[];
  };
  ninetyDayPath: { weeks: { label: string; focus: string }[]; assumptions: string };
  quickWins: string[];
  nextStep: { cta: CtaType; headline: string; body: string };
};

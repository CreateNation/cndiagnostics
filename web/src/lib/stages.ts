import type { StageId } from "./types";

export type StageDefinition = {
  id: StageId;
  name: string;
  revenueLabel: string;
  bottleneck: string;
  nextMilestone: string;
};

export const STAGES: Record<StageId, StageDefinition> = {
  1: {
    id: 1,
    name: "Validation",
    revenueLabel: "Pre-revenue",
    bottleneck: "Unclear demand, offer, or positioning",
    nextMilestone: "First paying customers at a validated price",
  },
  2: {
    id: 2,
    name: "Launch",
    revenueLabel: "< AED 50K/mo",
    bottleneck: "Inconsistent customers and uncertain pricing",
    nextMilestone: "Repeatable acquisition channel proven",
  },
  3: {
    id: 3,
    name: "Traction",
    revenueLabel: "AED 50K–200K/mo",
    bottleneck: "Founder is the bottleneck in sales and delivery",
    nextMilestone: "Delegated sales/delivery plus a real funnel system",
  },
  4: {
    id: 4,
    name: "Scale",
    revenueLabel: "AED 200K–500K/mo",
    bottleneck: "Growth straining cash flow, people, and quality",
    nextMilestone: "Managers and processes in place",
  },
  5: {
    id: 5,
    name: "Established Business",
    revenueLabel: "AED 500K–1M/mo",
    bottleneck: "Founder-dependent decisions",
    nextMilestone: "Independent leadership and financial controls",
  },
  6: {
    id: 6,
    name: "Expansion",
    revenueLabel: "> AED 1M/mo",
    bottleneck: "Replicating success without margin erosion",
    nextMilestone: "Profitable expansion into new markets or lines",
  },
};

/** Q3 revenue bracket value → primary stage */
export const REVENUE_TO_STAGE: Record<string, StageId> = {
  "pre-revenue": 1,
  "under-50k": 2,
  "50k-200k": 3,
  "200k-500k": 4,
  "500k-1m": 5,
  "over-1m": 6,
};

export function clampStage(n: number): StageId {
  return Math.min(6, Math.max(1, n)) as StageId;
}

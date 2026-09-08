import Anthropic from "@anthropic-ai/sdk";
import type { Answers, ClientReport, ReportPages, ScoringResult } from "../types";
import {
  REPORT_SYSTEM_PROMPT,
  buildReportUserPayload,
  mockReportPages,
  wrapClientReport,
} from "./prompt";
import { normalizeReportPages } from "./normalize";

const USER_PROMPT_PREFIX = `Generate the full 12-page diagnostic report as JSON with keys: cover, stage, scorecard, bottleneck, strengthsRisks, leak, nextStage, costOfStaying, priorityMatrix, ninetyDayPath, quickWins, nextStep.

Return ONLY valid JSON — no markdown fences.

INPUT:
`;

function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  return new Anthropic({
    apiKey: key,
    ...(workspaceId
      ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } }
      : {}),
  });
}

function extractJson(text: string, scoring?: ScoringResult | null): ReportPages {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return normalizeReportPages(JSON.parse(raw), scoring);
}

async function generateWithClaude(
  payload: unknown,
  scoring: ScoringResult,
): Promise<ClientReport> {
  const client = getAnthropic();
  if (!client) throw new Error("Anthropic client not configured");

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
    max_tokens: 8192,
    temperature: 0.3,
    system: REPORT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${USER_PROMPT_PREFIX}${JSON.stringify(payload)}`,
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  if (!text) throw new Error("Empty Claude response");
  return wrapClientReport(extractJson(text, scoring), "claude");
}

export async function generateClientReport(input: {
  answers: Answers;
  scoring: ScoringResult;
  name: string | null;
  email: string | null;
}): Promise<ClientReport> {
  const contact = { name: input.name, email: input.email };
  const payload = buildReportUserPayload(
    input.answers,
    input.scoring,
    contact,
  );

  if (!getAnthropic()) {
    console.info("[report] ANTHROPIC_API_KEY missing — using mock report");
    return wrapClientReport(
      mockReportPages(input.answers, input.scoring, contact),
      "mock",
    );
  }

  try {
    return await generateWithClaude(payload, input.scoring);
  } catch (err) {
    console.error("[report] Claude failed, falling back to mock", err);
    return wrapClientReport(
      mockReportPages(input.answers, input.scoring, contact),
      "mock",
    );
  }
}

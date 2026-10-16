import { NextResponse } from "next/server";
import { scoreAnswers } from "@/lib/scoring";
import {
  appendEvent,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { absoluteUrl } from "@/lib/urls";
import type { Answers } from "@/lib/types";

/**
 * Saves answers + scoring, marks report_generating, returns bridge URL quickly.
 * Heavy AI work runs on /api/quiz/[id]/generate (kicked from the bridge page).
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const submission = await getSubmission(id);
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    submission.status !== "paid" &&
    submission.status !== "quiz_in_progress" &&
    submission.status !== "quiz_completed" &&
    submission.status !== "report_failed" &&
    submission.status !== "report_generating"
  ) {
    if (submission.status === "report_ready" && submission.report) {
      return NextResponse.json({
        ok: true,
        idempotent: true,
        generating: false,
        bridgeUrl: absoluteUrl(`/bridge/${submission.id}`),
        reportUrl: absoluteUrl(`/report/${submission.clientReportToken}`),
        cta: submission.scoring?.cta,
        stageName: submission.scoring?.stageName,
      });
    }
    return NextResponse.json(
      { error: "Submission is not unlocked for quiz" },
      { status: 402 },
    );
  }

  // Already generating — send them to the bridge progress UI.
  if (submission.status === "report_generating" && submission.scoring) {
    return NextResponse.json({
      ok: true,
      generating: true,
      bridgeUrl: absoluteUrl(`/bridge/${id}`),
      cta: submission.scoring.cta,
      stageName: submission.scoring.stageName,
    });
  }

  const body = (await req.json()) as { answers: Answers };
  const answers = body.answers ?? {};

  if (!answers.Q3) {
    return NextResponse.json({ error: "Q3 is required" }, { status: 400 });
  }
  if (!answers.Q25) {
    return NextResponse.json(
      { error: "Q25 email is required for delivery" },
      { status: 400 },
    );
  }

  let scoring;
  try {
    scoring = scoreAnswers(answers);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring failed" },
      { status: 400 },
    );
  }

  await updateSubmission(id, {
    answers,
    scoring,
    email: String(answers.Q25),
    status: "quiz_completed",
  });
  await appendEvent(id, "quiz_completed");
  await appendEvent(id, "report_generation_started");
  await updateSubmission(id, { status: "report_generating" });

  return NextResponse.json({
    ok: true,
    generating: true,
    bridgeUrl: absoluteUrl(`/bridge/${id}`),
    cta: scoring.cta,
    stageName: scoring.stageName,
  });
}

import { NextResponse } from "next/server";
import { scoreAnswers } from "@/lib/scoring";
import {
  appendEvent,
  getSubmission,
  updateSubmission,
} from "@/lib/store";
import { generateClientReport } from "@/lib/report/generate";
import { buildGhlFields, pushToGhl, stripCloserOnly } from "@/lib/ghl";
import { absoluteUrl } from "@/lib/urls";
import { ensureReportEmailSent } from "@/lib/report-email";
import type { Answers, AdvisorIntel } from "@/lib/types";

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
    submission.status !== "report_failed"
  ) {
    if (submission.status === "report_ready" && submission.report) {
      return NextResponse.json({
        ok: true,
        idempotent: true,
        bridgeUrl: absoluteUrl(`/bridge/${submission.id}`),
        reportUrl: absoluteUrl(`/report/${submission.clientReportToken}`),
      });
    }
    return NextResponse.json(
      { error: "Submission is not unlocked for quiz" },
      { status: 402 },
    );
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

  try {
    const report = await generateClientReport({
      answers,
      scoring,
      name: submission.name,
      email: String(answers.Q25),
    });

    const advisorIntel: AdvisorIntel = {
      band: scoring.band,
      urgency: scoring.urgency,
      objection: scoring.objection,
      spend: scoring.spend,
      team: scoring.team,
      activities: scoring.activities,
      confidence: scoring.confidence,
      rawAnswers: answers,
      flags: scoring.flags,
      contradictions: scoring.contradictions,
    };

    const ready = await updateSubmission(id, {
      status: "report_ready",
      report,
      advisorIntel,
    });

    await appendEvent(id, "client_report_ready");
    await appendEvent(id, "advisor_report_ready");

    const clientUrl = absoluteUrl(`/report/${ready.clientReportToken}`);
    const advisorUrl = absoluteUrl(`/advisor/${ready.advisorReportToken}`);
    const fields = buildGhlFields(ready, scoring, {
      client: clientUrl,
      advisor: advisorUrl,
    });

    await pushToGhl({
      event: "client_report_ready",
      submission_id: id,
      email: String(answers.Q25),
      name: submission.name,
      fields: stripCloserOnly(fields),
      contactFacingSafe: true,
    });

    await pushToGhl({
      event: "advisor_report_ready",
      submission_id: id,
      email: String(answers.Q25),
      name: submission.name,
      fields,
      contactFacingSafe: false,
    });

    const emailResult = await ensureReportEmailSent(id);

    return NextResponse.json({
      ok: true,
      bridgeUrl: absoluteUrl(`/bridge/${id}`),
      reportUrl: clientUrl,
      cta: scoring.cta,
      stageName: scoring.stageName,
      email: emailResult,
    });
  } catch (err) {
    console.error(err);
    await updateSubmission(id, { status: "report_failed" });
    await appendEvent(id, "report_generation_failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getSubmission, updateSubmission, appendEvent } from "@/lib/store";
import { generateClientReport } from "@/lib/report/generate";
import type { AdvisorIntel } from "@/lib/types";
import { absoluteUrl } from "@/lib/urls";

/** Dev helper: regenerate AI report for an existing submission */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const submission = await getSubmission(id);
  if (!submission?.scoring || !Object.keys(submission.answers).length) {
    return NextResponse.json(
      { error: "Submission incomplete" },
      { status: 404 },
    );
  }

  await updateSubmission(id, { status: "report_generating" });
  await appendEvent(id, "report_regeneration_started");

  try {
    const report = await generateClientReport({
      answers: submission.answers,
      scoring: submission.scoring,
      name: submission.name,
      email: submission.email,
    });

    const advisorIntel: AdvisorIntel = {
      band: submission.scoring.band,
      urgency: submission.scoring.urgency,
      objection: submission.scoring.objection,
      spend: submission.scoring.spend,
      team: submission.scoring.team,
      activities: submission.scoring.activities,
      confidence: submission.scoring.confidence,
      rawAnswers: submission.answers,
      flags: submission.scoring.flags,
      contradictions: submission.scoring.contradictions,
    };

    const ready = await updateSubmission(id, {
      status: "report_ready",
      report,
      advisorIntel,
    });
    await appendEvent(id, "client_report_ready", { regenerated: true });

    return NextResponse.json({
      ok: true,
      generator: report.generator,
      reportUrl: absoluteUrl(`/report/${ready.clientReportToken}`),
    });
  } catch (err) {
    await updateSubmission(id, { status: "report_failed" });
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Regeneration failed",
      },
      { status: 500 },
    );
  }
}

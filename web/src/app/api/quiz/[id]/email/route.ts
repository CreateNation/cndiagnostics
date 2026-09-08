import { NextResponse } from "next/server";
import { getSubmission } from "@/lib/store";
import { ensureReportEmailSent } from "@/lib/report-email";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const submission = await getSubmission(id);
  if (!submission?.report || !submission.scoring || !submission.clientReportToken) {
    return NextResponse.json(
      { error: "Report not ready" },
      { status: 404 },
    );
  }

  const result = await ensureReportEmailSent(id);
  if (!result.sent && !result.alreadySent) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}

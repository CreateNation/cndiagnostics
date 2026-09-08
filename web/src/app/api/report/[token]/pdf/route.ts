import { NextResponse } from "next/server";
import { getByClientToken } from "@/lib/store";
import { buildReportPdf, reportPdfFilename } from "@/lib/report/pdf";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const submission = await getByClientToken(token);
  if (!submission?.report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  try {
    const pdf = await buildReportPdf({
      report: submission.report,
      scoring: submission.scoring,
      ninetyDayUnlocked: Boolean(submission.ninetyDayUnlockedAt),
    });
    const filename = reportPdfFilename(
      submission.report.pages.cover.businessName || "report",
    );

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[pdf]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getByAdvisorToken } from "@/lib/store";
import { buildReportPdf, reportPdfFilename } from "@/lib/report/pdf";
import { bookingUrl } from "@/lib/urls";

/** Internal PDF — full 90-day path visible. Never share this link with the client. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const submission = await getByAdvisorToken(token);
  if (!submission?.report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  try {
    const pdf = await buildReportPdf({
      report: submission.report,
      scoring: submission.scoring,
      ninetyDayUnlocked: true,
      bookingHref: bookingUrl(),
    });
    const business =
      submission.report.pages.cover.businessName || "report";
    const filename = reportPdfFilename(`${business}-full`);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[advisor-pdf]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 },
    );
  }
}

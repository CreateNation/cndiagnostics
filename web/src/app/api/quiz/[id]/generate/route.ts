import { NextResponse } from "next/server";
import { runReportGeneration } from "@/lib/report/run-generation";

/** Runs AI report generation (called from the bridge progress page). */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const result = await runReportGeneration(id);

  if (!result.ok) {
    const status = result.error === "Not found" ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}

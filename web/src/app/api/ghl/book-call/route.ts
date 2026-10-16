import { NextResponse } from "next/server";
import { getSubmission } from "@/lib/store";
import { syncBookCallStageToGhl } from "@/lib/ghl-lead";

/** Move opportunity to Book Call when the user clicks a booking CTA. */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      submissionId?: string;
    };
    const submissionId = body.submissionId?.trim();
    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId required" },
        { status: 400 },
      );
    }

    const submission = await getSubmission(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await syncBookCallStageToGhl(submission);
    return NextResponse.json({
      ok: !result.error,
      opportunityId: result.opportunityId,
      error: result.error ?? null,
    });
  } catch (err) {
    console.error("[ghl book-call]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

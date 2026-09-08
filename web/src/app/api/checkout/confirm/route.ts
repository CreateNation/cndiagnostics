import { NextResponse } from "next/server";
import { confirmCheckoutSession } from "@/lib/confirm-checkout";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    submissionId?: string;
    sessionId?: string;
  };

  if (!body.submissionId || !body.sessionId) {
    return NextResponse.json(
      { error: "submissionId and sessionId required" },
      { status: 400 },
    );
  }

  const updated = await confirmCheckoutSession(
    body.submissionId,
    body.sessionId,
  );

  if (!updated) {
    return NextResponse.json({ error: "Unable to confirm" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: updated.status });
}

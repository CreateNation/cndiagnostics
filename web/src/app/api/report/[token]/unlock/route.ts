import { NextResponse } from "next/server";
import {
  appendEvent,
  getByClientToken,
  updateSubmission,
} from "@/lib/store";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const submission = await getByClientToken(token);
  if (!submission?.report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (submission.ninetyDayUnlockedAt) {
    return NextResponse.json({ unlocked: true, already: true });
  }

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim().toUpperCase();
  const expected = (submission.ninetyDayUnlockCode ?? "").toUpperCase();

  if (!expected) {
    return NextResponse.json(
      { error: "Unlock code not set for this report" },
      { status: 400 },
    );
  }

  if (!code || code !== expected) {
    return NextResponse.json({ error: "Invalid unlock code" }, { status: 403 });
  }

  await updateSubmission(submission.id, {
    ninetyDayUnlockedAt: new Date().toISOString(),
  });
  await appendEvent(submission.id, "ninety_day_unlocked");

  return NextResponse.json({ unlocked: true });
}

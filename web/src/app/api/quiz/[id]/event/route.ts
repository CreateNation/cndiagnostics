import { NextResponse } from "next/server";
import { appendEvent, getSubmission, updateSubmission } from "@/lib/store";
import type { Answers } from "@/lib/types";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const submission = await getSubmission(id);
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    event: string;
    answers?: Answers;
    questionIndex?: number;
  };

  if (body.event === "quiz_started" && submission.status === "paid") {
    await updateSubmission(id, { status: "quiz_in_progress" });
  }

  if (body.answers) {
    await updateSubmission(id, {
      answers: { ...submission.answers, ...body.answers },
    });
  }

  await appendEvent(id, body.event, {
    questionIndex: body.questionIndex,
  });

  return NextResponse.json({ ok: true });
}

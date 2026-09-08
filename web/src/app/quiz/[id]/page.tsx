import { getSubmission } from "@/lib/store";
import { confirmCheckoutSession } from "@/lib/confirm-checkout";
import { QuizFlow } from "@/components/quiz-flow";
import { BrandLogo, SiteFooter } from "@/components/site-chrome";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  let submission = await getSubmission(id);
  if (!submission) notFound();

  if (sessionId && submission.status === "pending_payment") {
    submission =
      (await confirmCheckoutSession(id, sessionId)) ?? submission;
  }

  const unlocked = [
    "paid",
    "quiz_in_progress",
    "quiz_completed",
    "report_generating",
    "report_ready",
    "report_failed",
  ].includes(submission.status);

  return (
    <div className="flex min-h-full flex-col bg-[var(--cn-paper)]">
      <header className="sticky top-0 z-20 border-b border-[var(--cn-line)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-4">
            <BrandLogo tone="light" size="md" />
            <span className="cn-display hidden text-[10px] tracking-[0.22em] text-[var(--cn-ink)] sm:inline">
              Growth Diagnostic
            </span>
          </Link>
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-[var(--cn-muted)] sm:inline">
            25 questions · ~5 minutes
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 md:py-16">
        <QuizFlow
          submissionId={submission.id}
          initialAnswers={submission.answers}
          unlocked={unlocked}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

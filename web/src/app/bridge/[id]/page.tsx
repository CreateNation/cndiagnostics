import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmission } from "@/lib/store";
import { bookingUrl } from "@/lib/urls";
import { BrandLogo, SiteFooter } from "@/components/site-chrome";
import { BridgePoller } from "@/components/bridge-poller";

export default async function BridgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) notFound();

  const ready = submission.status === "report_ready" && submission.report;
  const failed = submission.status === "report_failed";
  const cta = submission.scoring?.cta ?? "email_nurture";
  const reportHref = submission.clientReportToken
    ? `/report/${submission.clientReportToken}`
    : null;
  const emailAlreadySent = Boolean(submission.reportEmailSentAt);

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-[var(--cn-charcoal)] text-white">
      <div aria-hidden className="cn-surface-dark pointer-events-none absolute inset-0" />
      <div aria-hidden className="cn-grain pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center px-6 py-6">
          <Link href="/">
            <BrandLogo size="sm" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        {!ready && !failed && (
          <div className="mb-8 flex items-center gap-4">
            <div
              aria-hidden
              className="h-[3px] w-24 overflow-hidden rounded-full bg-white/15"
            >
              <div className="h-full w-1/2 animate-pulse-soft rounded-full bg-[var(--cn-red)]" />
            </div>
          </div>
        )}

        {ready && (
          <div
            aria-hidden
            className="mb-8 h-[3px] w-24 rounded-full bg-[var(--cn-red)] animate-draw-line"
          />
        )}

        <p className="cn-display animate-fade-up text-xs tracking-[0.28em] text-[var(--cn-red)]">
          Create Nation Diagnostic
        </p>
        <h1 className="cn-display animate-fade-up-delay mt-4 text-4xl leading-[1.05] sm:text-6xl">
          {failed
            ? "We hit a snag building your report"
            : ready
              ? "Your diagnosis is ready"
              : "Your diagnosis is being built"}
        </h1>
        <p className="animate-fade-up-late mt-6 max-w-xl text-lg leading-relaxed text-white/62">
          {failed
            ? "Please retry from the quiz or contact us. Your answers were saved."
            : ready
              ? "Based on your answers, your personalized growth report is ready to open — and we’re sending a copy to your email."
              : "We’re generating your personalized growth report now. This usually takes under a minute."}
        </p>

        <BridgePoller
          ready={!!ready}
          failed={failed}
          submissionId={id}
          email={submission.email}
          emailAlreadySent={emailAlreadySent}
        />

        {ready && reportHref && (
          <Link
            href={reportHref}
            className="cn-btn mt-10 w-fit animate-fade-up-late"
          >
            Open my report
            <span aria-hidden>↗</span>
          </Link>
        )}

        {cta === "book_call" && (
          <div className="mt-14 border-t border-white/12 pt-10 animate-fade-up-late">
            <h2 className="cn-display text-2xl sm:text-3xl">
              {ready
                ? "Ready to close the gap?"
                : "While you wait — lock in your strategy call"}
            </h2>
            <p className="mt-4 max-w-xl text-white/58">
              Your report shows where the leak is. On a short call, we walk
              through exactly how to close it.
            </p>
            <a
              href={bookingUrl()}
              target="_blank"
              rel="noreferrer"
              className="cn-btn-ghost mt-6"
            >
              Book your strategy call
              <span aria-hidden>↗</span>
            </a>
          </div>
        )}

        {cta === "email_nurture" && ready && (
          <p className="mt-12 max-w-xl text-white/55">
            Keep an eye on your inbox — growth resources will follow your report.
            A strategy call isn&apos;t the next step at your current stage.
          </p>
        )}
      </main>
      <SiteFooter tone="dark" />
    </div>
  );
}

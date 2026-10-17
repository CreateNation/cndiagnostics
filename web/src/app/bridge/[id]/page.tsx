import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmission } from "@/lib/store";
import { bookingUrl } from "@/lib/urls";
import { BrandLogo, SiteFooter } from "@/components/site-chrome";
import { BridgePoller } from "@/components/bridge-poller";
import { ReportGeneratingLoader } from "@/components/report-generating-loader";
import { TrackedLink } from "@/components/analytics/tracked-link";

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
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-[var(--cn-charcoal)] text-white">
      <div aria-hidden className="cn-surface-dark pointer-events-none absolute inset-0" />
      <div aria-hidden className="cn-grain pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4 sm:px-6 sm:py-6">
          <Link href="/" className="shrink-0">
            <BrandLogo size="sm" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-20">
        {ready && (
          <div
            aria-hidden
            className="mb-6 h-[3px] w-20 rounded-full bg-[var(--cn-red)] animate-draw-line sm:mb-8 sm:w-24"
          />
        )}

        <p className="cn-display animate-fade-up text-[11px] tracking-[0.22em] text-[var(--cn-red)] sm:text-xs sm:tracking-[0.28em]">
          Create Nation Diagnostic
        </p>
        <h1 className="cn-display animate-fade-up-delay mt-3 max-w-2xl text-[1.85rem] leading-[1.08] sm:mt-4 sm:text-5xl">
          {failed
            ? "We hit a snag building your report"
            : ready
              ? "Your diagnosis is ready"
              : "Building your diagnosis"}
        </h1>
        {(ready || failed) && (
          <p className="animate-fade-up-late mt-5 max-w-xl text-base leading-relaxed text-white/62 sm:mt-6 sm:text-lg">
            {failed
              ? "Please retry from the quiz or contact us. Your answers were saved."
              : "Based on your answers, your personalized growth report is ready to open — and we’re emailing you the PDF."}
          </p>
        )}

        {!ready && !failed && <ReportGeneratingLoader />}

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
            className="cn-btn mt-8 w-full justify-center animate-fade-up-late sm:mt-10 sm:w-fit"
          >
            Open my report
            <span aria-hidden>↗</span>
          </Link>
        )}

        {cta === "book_call" && (
          <div className="mt-10 border-t border-white/12 pt-8 animate-fade-up-late sm:mt-14 sm:pt-10">
            <h2 className="cn-display text-xl sm:text-3xl">
              {ready
                ? "Ready to close the gap?"
                : "While you wait — lock in your strategy call"}
            </h2>
            <p className="mt-4 max-w-xl text-sm text-white/58 sm:text-base">
              Your report shows where the leak is. On a short call, we walk
              through exactly how to close it.
            </p>
            <TrackedLink
              href={bookingUrl()}
              className="cn-btn-ghost mt-6 w-full justify-center sm:w-auto"
              source="bridge"
              submissionId={id}
            >
              Book your strategy call
              <span aria-hidden>↗</span>
            </TrackedLink>
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

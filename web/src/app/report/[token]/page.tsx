import { notFound } from "next/navigation";
import Link from "next/link";
import { getByClientToken } from "@/lib/store";
import { bookingUrl } from "@/lib/urls";
import { BrandLogo, SiteFooter } from "@/components/site-chrome";
import { NinetyDayGate } from "@/components/ninety-day-gate";
import { normalizeReportPages } from "@/lib/report/normalize";
import { ReportViewTracker } from "@/components/analytics/report-view-tracker";
import { TrackedLink } from "@/components/analytics/tracked-link";
import {
  DimensionBars,
  DimensionRadar,
  ScoreDonut,
} from "@/components/report/score-charts";
import {
  ChipRow,
  CostBanner,
  LeakSpotlight,
  MilestoneCard,
  NoteChip,
  ScanLead,
  VisualList,
} from "@/components/report/scannable-blocks";
import { SoftCta } from "@/components/report/soft-cta";
import { toScanBlock } from "@/lib/report/scannable";
import { isSandboxMode } from "@/lib/runtime-flags";

function avgScore(dims: Record<string, number>): number {
  const vals = Object.values(dims);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default async function ClientReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const submission = await getByClientToken(token);
  if (!submission?.report) notFound();

  const pages = normalizeReportPages(
    submission.report.pages,
    submission.scoring,
  );
  const cta = pages.nextStep.cta;
  // Production: only Priority/Nurture (book_call). Sandbox: always show so you can preview CTAs.
  const bookCall = cta === "book_call" || isSandboxMode();
  const bookHref = bookingUrl();
  const sid = submission.id;
  const overall = avgScore(pages.scorecard.dimensions);
  const nextBody = toScanBlock(pages.nextStep.body);

  return (
    <div className="min-h-full overflow-x-hidden bg-[var(--cn-paper)]">
      <ReportViewTracker token={token} stageName={pages.cover.stageName} />
      <header className="relative overflow-hidden bg-[var(--cn-charcoal)] text-white">
        <div aria-hidden className="cn-surface-dark pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="cn-arc-pattern pointer-events-none absolute inset-0 opacity-70"
        />
        <div className="relative mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
          <Link href="/" className="shrink-0">
            <BrandLogo size="sm" />
          </Link>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {bookCall ? (
              <TrackedLink
                href={bookHref}
                source="report_header"
                submissionId={sid}
                className="cn-display hidden truncate text-[9px] tracking-[0.16em] text-white/55 transition hover:text-white sm:inline sm:tracking-[0.2em]"
              >
                Talk to Luay
              </TrackedLink>
            ) : null}
            <span className="cn-display truncate text-[9px] tracking-[0.16em] text-white/45 sm:text-[10px] sm:tracking-[0.2em]">
              Growth Diagnostic
            </span>
          </div>
        </div>

        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8">
          <p className="cn-display text-[11px] tracking-[0.22em] text-[var(--cn-red)] sm:text-xs sm:tracking-[0.28em]">
            Client report
          </p>
          <h1 className="cn-display mt-3 text-[1.85rem] leading-[1.05] break-words sm:mt-4 sm:text-5xl md:text-6xl">
            {pages.cover.businessName}
          </h1>
          <div
            aria-hidden
            className="mt-5 h-[3px] w-16 bg-[var(--cn-red)] sm:mt-6 sm:w-20"
          />
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white">
              {pages.cover.stageName}
            </span>
            <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white/70">
              {pages.cover.date}
            </span>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
            {bookCall ? (
              <div>
                <TrackedLink
                  href={bookHref}
                  source="report_hero"
                  submissionId={sid}
                  className="cn-btn w-full whitespace-nowrap sm:w-auto"
                >
                  Book a strategy call
                  <span aria-hidden>↗</span>
                </TrackedLink>
                <p className="mt-2 text-center text-[11px] text-white/45 sm:text-left">
                  Free · 20 min · No obligation
                </p>
              </div>
            ) : null}
            <a
              href={`/api/report/${token}/pdf`}
              className="cn-btn-ghost inline-flex w-full justify-center whitespace-nowrap border-white/25 sm:w-auto"
            >
              Download PDF
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <ReportSection index="01" title="Your stage" accent>
          <ChipRow
            items={[
              { label: "Stage", value: pages.stage.stageName },
              {
                label: "Confidence",
                value: pages.stage.confidence,
              },
            ]}
          />
          <div className="mt-6">
            <ScanLead text={pages.stage.evidence} />
          </div>
          <NoteChip text={pages.stage.scopeBoundary} />
        </ReportSection>

        <ReportSection index="02" title="Your scores">
          <ScanLead text={pages.scorecard.summary} />
          <div className="mt-8 grid items-center gap-10 sm:grid-cols-[minmax(0,11rem)_1fr]">
            <div className="flex flex-col items-center gap-6">
              <ScoreDonut score={overall} label="Overall" />
              <DimensionRadar dimensions={pages.scorecard.dimensions} />
            </div>
            <DimensionBars dimensions={pages.scorecard.dimensions} />
          </div>
        </ReportSection>

        <SoftCta
          enabled={bookCall}
          href={bookHref}
          submissionId={sid}
          source="report_after_scores"
          variant="whisper"
          eyebrow="Need a second pair of eyes?"
          title="We can walk through these scores with you in 20 minutes."
          body="No pitch deck — just clarity on what to fix first."
          buttonLabel="Book my free call"
        />

        <ReportSection index="03" title="Main problem" accent>
          <p className="cn-display text-2xl leading-tight text-[var(--cn-red)] sm:text-3xl">
            {pages.bottleneck.title}
          </p>
          <div className="mt-5">
            <ScanLead text={pages.bottleneck.explanation} />
          </div>
          <VisualList items={pages.bottleneck.evidence} tone="warn" max={3} />
        </ReportSection>

        <ReportSection index="04" title="What helps · what hurts">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[0.75rem] border border-[var(--cn-line)] bg-white px-4 py-4">
              <h4 className="cn-display text-[11px] tracking-[0.2em] text-emerald-700">
                Helps you
              </h4>
              <VisualList
                items={pages.strengthsRisks.strengths}
                tone="good"
                max={3}
              />
            </div>
            <div className="rounded-[0.75rem] border border-[var(--cn-line)] bg-[color-mix(in_srgb,var(--cn-red)_5%,white)] px-4 py-4">
              <h4 className="cn-display text-[11px] tracking-[0.2em] text-[var(--cn-red)]">
                Holds you back
              </h4>
              <VisualList
                items={pages.strengthsRisks.risks}
                tone="warn"
                max={3}
              />
            </div>
          </div>
        </ReportSection>

        <LeakSpotlight
          index="05"
          diagnosis={pages.leak.diagnosis}
          leakPoints={pages.leak.leakPoints}
        />

        <SoftCta
          enabled={bookCall}
          href={bookHref}
          submissionId={sid}
          source="report_after_leak"
          variant="card"
          eyebrow="You found the leak"
          title="Want help closing it?"
          body="Luay will map a simple plan for your stage — on a complimentary call."
          buttonLabel="Book my free call"
        />

        <ReportSection index="06" title="What “better” looks like">
          <MilestoneCard
            title={pages.nextStage.milestone}
            detail={pages.nextStage.whatItLooksLike}
          />
        </ReportSection>

        <ReportSection index="07" title="Cost of waiting" accent>
          <CostBanner
            narrative={pages.costOfStaying.narrative}
            note={pages.costOfStaying.note}
          />
        </ReportSection>

        <SoftCta
          enabled={bookCall}
          href={bookHref}
          submissionId={sid}
          source="report_after_cost"
          variant="accent"
          eyebrow="Ready when you are"
          title="A short call often saves months of trial and error."
          body="Bring this report. We’ll turn it into next steps."
          buttonLabel="Get my plan on a call"
        />

        <ReportSection index="08" title="Do this · skip that">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Do now", pages.priorityMatrix.now, true],
                ["Do next", pages.priorityMatrix.next, false],
                ["Later", pages.priorityMatrix.later, false],
                ["Skip", pages.priorityMatrix.avoid, false],
              ] as const
            ).map(([label, items, hot]) => (
              <div
                key={label}
                className={`rounded-[0.75rem] border px-4 py-4 ${
                  hot
                    ? "border-[var(--cn-red)]/40 bg-[color-mix(in_srgb,var(--cn-red)_7%,white)]"
                    : "border-[var(--cn-line)] bg-white"
                }`}
              >
                <h4 className="cn-display text-[11px] tracking-[0.2em] text-[var(--cn-red)]">
                  {label}
                </h4>
                <VisualList items={items} max={3} />
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection index="09" title="90-day path" accent>
          <NinetyDayGate
            bookingHref={bookingUrl()}
            submissionId={submission.id}
          >
            <ol className="grid gap-3">
              {pages.ninetyDayPath.weeks.map((w, i) => {
                const focus = toScanBlock(w.focus);
                return (
                  <li
                    key={w.label}
                    className="flex gap-4 rounded-[0.75rem] border border-[var(--cn-line)] bg-white px-4 py-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cn-red)] cn-display text-xs text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="cn-display text-sm text-[var(--cn-ink)]">
                        {w.label}
                      </p>
                      <p className="mt-1 text-[0.95rem] leading-snug text-[var(--cn-ink)]/80">
                        {focus.lead || w.focus}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <NoteChip text={pages.ninetyDayPath.assumptions} />
          </NinetyDayGate>
        </ReportSection>

        <ReportSection index="10" title="This week">
          <ol className="grid gap-2.5 sm:grid-cols-2">
            {pages.quickWins.slice(0, 6).map((w, i) => {
              const line = toScanBlock(w).lead || w;
              return (
                <li
                  key={w}
                  className="flex gap-3 rounded-[0.65rem] border border-[var(--cn-line)] bg-white px-3.5 py-3"
                >
                  <span className="cn-display text-sm text-[var(--cn-red)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.95rem] leading-snug text-[var(--cn-ink)]">
                    {line}
                  </span>
                </li>
              );
            })}
          </ol>
        </ReportSection>

        <SoftCta
          enabled={bookCall}
          href={bookHref}
          submissionId={sid}
          source="report_before_footer"
          variant="whisper"
          eyebrow="Prefer a guided plan?"
          title="We can prioritise this week’s list with you."
          buttonLabel="Book my free call"
        />

        <section className="relative mt-4 overflow-hidden rounded-[1rem] bg-[var(--cn-charcoal)] px-6 py-10 text-white sm:mt-6 sm:px-10">
          <div
            aria-hidden
            className="cn-arc-pattern pointer-events-none absolute inset-0 opacity-60"
          />
          <div className="relative">
            <p className="cn-display text-xs tracking-[0.24em] text-[var(--cn-red)]">
              Next step
            </p>
            <h2 className="cn-display mt-3 text-3xl leading-tight sm:text-4xl">
              {pages.nextStep.headline}
            </h2>
            {nextBody.lead ? (
              <p className="mt-4 max-w-xl text-base leading-snug text-white/70">
                {nextBody.lead}
              </p>
            ) : null}
            {nextBody.bullets.length > 0 ? (
              <ul className="mt-4 max-w-xl space-y-2">
                {nextBody.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-white/55">
                    <span aria-hidden className="text-[var(--cn-red)]">
                      →
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {bookCall ? (
              <div className="mt-8">
                <TrackedLink
                  href={bookHref}
                  className="cn-btn w-full whitespace-nowrap sm:w-auto"
                  source="report_footer"
                  submissionId={sid}
                >
                  Book a call with Luay Fawaz
                  <span aria-hidden>↗</span>
                </TrackedLink>
                <p className="mt-2 text-center text-[11px] text-white/45 sm:text-left">
                  Free · 20 min · No obligation
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </article>
      <SiteFooter />
    </div>
  );
}

function ReportSection({
  index,
  title,
  children,
  accent = false,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`mb-5 scroll-mt-6 rounded-[1rem] border border-[var(--cn-line)] px-5 py-7 sm:mb-6 sm:px-8 sm:py-9 ${
        accent
          ? "bg-white shadow-[0_1px_0_rgba(14,14,14,0.04)]"
          : "bg-[color-mix(in_srgb,var(--cn-paper)_55%,white)]"
      }`}
    >
      <header className="mb-6 flex items-start gap-4 border-b border-[var(--cn-line)] pb-5">
        <span className="cn-display mt-1 text-xs tracking-[0.2em] text-[var(--cn-red)]">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="cn-display text-xl leading-tight tracking-wide text-[var(--cn-ink)] sm:text-2xl">
            {title}
          </h2>
          <div
            aria-hidden
            className="mt-3 h-[2px] w-10 bg-[var(--cn-red)]"
          />
        </div>
      </header>
      <div className="text-[var(--cn-ink)]">{children}</div>
    </section>
  );
}

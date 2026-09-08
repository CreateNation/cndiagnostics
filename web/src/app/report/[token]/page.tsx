import { notFound } from "next/navigation";
import Link from "next/link";
import { getByClientToken } from "@/lib/store";
import { bookingUrl } from "@/lib/urls";
import { BrandLogo, SiteFooter } from "@/components/site-chrome";
import { normalizeReportPages } from "@/lib/report/normalize";

const DIM_LABELS: Record<string, string> = {
  audience: "Audience & Positioning",
  offer: "Offer Strength",
  funnel: "Funnel & Conversion",
  content: "Content & Demand",
  systems: "Systems & Tracking",
};

function List({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[var(--cn-muted)]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--cn-red)]" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
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

  return (
    <div className="min-h-full bg-[var(--cn-paper)]">
      <header className="relative overflow-hidden bg-[var(--cn-charcoal)] text-white">
        <div aria-hidden className="cn-surface-dark pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="cn-arc-pattern pointer-events-none absolute inset-0 opacity-70"
        />
        <div className="relative mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link href="/">
            <BrandLogo size="sm" />
          </Link>
          <span className="cn-display text-[10px] tracking-[0.2em] text-white/45">
            Growth Diagnostic
          </span>
        </div>

        <div className="relative mx-auto max-w-3xl px-6 pb-14 pt-8">
          <p className="cn-display text-xs tracking-[0.28em] text-[var(--cn-red)]">
            Client report
          </p>
          <h1 className="cn-display mt-4 text-4xl leading-[0.98] sm:text-5xl md:text-6xl">
            {pages.cover.businessName}
          </h1>
          <div
            aria-hidden
            className="mt-6 h-[3px] w-20 bg-[var(--cn-red)]"
          />
          <p className="mt-6 text-lg text-white/58">
            Stage:{" "}
            <span className="text-white">{pages.cover.stageName}</span>
            <span className="mx-2 text-white/25">·</span>
            {pages.cover.date}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-14 px-6 py-14">
        <Section title="Your stage & what it means">
          <p className="text-lg leading-relaxed">{pages.stage.evidence}</p>
          <p className="mt-5 border-l-2 border-[var(--cn-red)] pl-4 text-sm leading-relaxed text-[var(--cn-muted)]">
            {pages.stage.scopeBoundary}
          </p>
        </Section>

        <Section title="Dimension scorecard">
          <p className="mb-8 leading-relaxed text-[var(--cn-muted)]">
            {pages.scorecard.summary}
          </p>
          <ul className="space-y-6">
            {Object.entries(pages.scorecard.dimensions).map(([key, score]) => (
              <li key={key}>
                <div className="mb-2 flex items-end justify-between gap-4">
                  <span className="cn-display text-sm tracking-[0.08em] text-[var(--cn-ink)]">
                    {DIM_LABELS[key] ?? key}
                  </span>
                  <span className="cn-display text-lg text-[var(--cn-red)]">
                    {score}
                    <span className="text-sm text-[var(--cn-muted)]">/100</span>
                  </span>
                </div>
                <div className="h-[4px] overflow-hidden rounded-full bg-[var(--cn-line)]">
                  <div
                    className="h-full origin-left rounded-full bg-[var(--cn-red)]"
                    style={{
                      width: `${Math.max(0, Math.min(100, score))}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Primary bottleneck">
          <h3 className="cn-display text-2xl leading-tight text-[var(--cn-ink)] sm:text-3xl">
            {pages.bottleneck.title}
          </h3>
          <p className="mt-4 leading-relaxed">{pages.bottleneck.explanation}</p>
          <List items={pages.bottleneck.evidence} />
        </Section>

        <Section title="Strengths & risks">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h4 className="cn-display text-xs tracking-[0.2em] text-[var(--cn-red)]">
                Strengths
              </h4>
              <List items={pages.strengthsRisks.strengths} />
            </div>
            <div>
              <h4 className="cn-display text-xs tracking-[0.2em] text-[var(--cn-red)]">
                Risks
              </h4>
              <List items={pages.strengthsRisks.risks} />
            </div>
          </div>
        </Section>

        <Section title="Where the leak is">
          <p className="leading-relaxed">{pages.leak.diagnosis}</p>
          <List items={pages.leak.leakPoints} />
        </Section>

        <Section title="What next stage looks like">
          <p className="cn-display text-xl text-[var(--cn-ink)]">
            {pages.nextStage.milestone}
          </p>
          <p className="mt-3 leading-relaxed text-[var(--cn-muted)]">
            {pages.nextStage.whatItLooksLike}
          </p>
        </Section>

        <Section title="Cost of staying here">
          <p className="leading-relaxed">{pages.costOfStaying.narrative}</p>
          <p className="mt-4 text-sm text-[var(--cn-muted)]">
            {pages.costOfStaying.note}
          </p>
        </Section>

        <Section title="Priority matrix">
          <div className="grid gap-8 sm:grid-cols-2">
            {(
              [
                ["Now", pages.priorityMatrix.now],
                ["Next", pages.priorityMatrix.next],
                ["Later", pages.priorityMatrix.later],
                ["Avoid", pages.priorityMatrix.avoid],
              ] as const
            ).map(([label, items]) => (
              <div key={label}>
                <h4 className="cn-display text-xs tracking-[0.2em] text-[var(--cn-red)]">
                  {label}
                </h4>
                <List items={items} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Directional 90-day path">
          <ul className="space-y-6">
            {pages.ninetyDayPath.weeks.map((w, i) => (
              <li key={w.label} className="flex gap-4">
                <span className="cn-display mt-0.5 text-sm text-[var(--cn-red)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="cn-display text-base text-[var(--cn-ink)]">
                    {w.label}
                  </p>
                  <p className="mt-1 leading-relaxed text-[var(--cn-muted)]">
                    {w.focus}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-[var(--cn-muted)]">
            {pages.ninetyDayPath.assumptions}
          </p>
        </Section>

        <Section title="7-day quick wins">
          <ol className="space-y-4">
            {pages.quickWins.map((w, i) => (
              <li key={w} className="flex gap-4">
                <span className="cn-display text-sm text-[var(--cn-red)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed text-[var(--cn-ink)]">{w}</span>
              </li>
            ))}
          </ol>
        </Section>

        <section className="relative overflow-hidden rounded-[1rem] bg-[var(--cn-charcoal)] px-6 py-10 text-white sm:px-10">
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
            <p className="mt-4 max-w-xl leading-relaxed text-white/62">
              {pages.nextStep.body}
            </p>
            {cta === "book_call" ? (
              <a
                href={bookingUrl()}
                target="_blank"
                rel="noreferrer"
                className="cn-btn mt-8 inline-flex"
              >
                Book strategy call
                <span aria-hidden>↗</span>
              </a>
            ) : (
              <p className="mt-8 text-sm text-white/50">
                No call CTA at this stage — nurture resources follow by email.
              </p>
            )}
          </div>
        </section>
      </article>
      <SiteFooter />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--cn-line)] pt-10">
      <h2 className="cn-display text-2xl tracking-wide text-[var(--cn-ink)] sm:text-3xl">
        {title}
      </h2>
      <div className="mt-5 text-[var(--cn-ink)]">{children}</div>
    </section>
  );
}

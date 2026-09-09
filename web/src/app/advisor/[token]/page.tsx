import { notFound } from "next/navigation";
import { getByAdvisorToken } from "@/lib/store";
import { normalizeReportPages } from "@/lib/report/normalize";
import { SiteFooter } from "@/components/site-chrome";

export default async function AdvisorReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const submission = await getByAdvisorToken(token);
  if (!submission?.report || !submission.advisorIntel || !submission.scoring) {
    notFound();
  }

  const intel = submission.advisorIntel;
  const scoring = submission.scoring;
  const pages = normalizeReportPages(submission.report.pages, scoring);
  const fullPdfHref = `/api/advisor/${token}/pdf`;

  return (
    <div className="min-h-full bg-[#0f0f0f] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="cn-display text-xs tracking-[0.22em] text-[var(--cn-red)]">
              Advisor only — never send to contact
            </p>
            <h1 className="cn-display mt-1 text-2xl">Pre-call intel</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
            <a
              href={fullPdfHref}
              className="cn-btn"
            >
              Download full PDF
              <span aria-hidden>↗</span>
            </a>
            <a
              href={`/report/${submission.clientReportToken}`}
              className="text-white/60 underline hover:text-white"
            >
              Open client report (blurred)
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Stage" value={scoring.stageName} />
          <Stat label="Band" value={intel.band} />
          <Stat label="Urgency" value={String(intel.urgency)} />
          <Stat label="Confidence" value={intel.confidence} />
        </div>

        <section className="rounded-lg border border-[var(--cn-red)]/40 bg-[var(--cn-red)]/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="cn-display text-xl text-[var(--cn-red)]">
                Directional 90-day path
              </h2>
              <p className="mt-2 text-sm text-white/65">
                Full version — client report and client PDF keep this section
                locked. Walk them through it on the complimentary call.
              </p>
            </div>
            <a href={fullPdfHref} className="cn-btn-ghost shrink-0 text-sm">
              Full PDF
              <span aria-hidden>↗</span>
            </a>
          </div>
          <ul className="mt-6 space-y-5">
            {pages.ninetyDayPath.weeks.map((w, i) => (
              <li key={w.label} className="flex gap-4">
                <span className="cn-display mt-0.5 text-sm text-[var(--cn-red)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="cn-display text-base text-white">{w.label}</p>
                  <p className="mt-1 leading-relaxed text-white/70">{w.focus}</p>
                </div>
              </li>
            ))}
          </ul>
          {pages.ninetyDayPath.assumptions ? (
            <p className="mt-6 text-sm text-white/50">
              {pages.ninetyDayPath.assumptions}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border border-white/10 p-5">
          <h2 className="cn-display text-xl">Closer signals</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Objection" value={intel.objection} />
            <Row label="Agency spend" value={intel.spend} />
            <Row label="Team" value={intel.team} />
            <Row
              label="Activities"
              value={intel.activities.join(", ") || "—"}
            />
            <Row label="CTA" value={scoring.cta} />
            <Row label="Email" value={submission.email} />
            <Row label="Phone" value={submission.phone} />
          </dl>
        </section>

        {(intel.flags.length > 0 || intel.contradictions.length > 0) && (
          <section className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5">
            <h2 className="cn-display text-xl text-amber-200">
              Flags for review
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-amber-50/90">
              {[...new Set([...intel.flags, ...intel.contradictions])].map(
                (f) => (
                  <li key={f}>{f}</li>
                ),
              )}
            </ul>
          </section>
        )}

        <section className="rounded-lg border border-white/10 p-5">
          <h2 className="cn-display text-xl">Dimension scores</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(scoring.dimensions).map(([k, v]) => (
              <li
                key={k}
                className="flex justify-between border-b border-white/5 py-2"
              >
                <span className="capitalize">{k}</span>
                <span>{v}/100</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-white/10 p-5">
          <h2 className="cn-display text-xl">Raw answers</h2>
          <pre className="mt-4 overflow-x-auto text-xs text-white/70">
            {JSON.stringify(intel.rawAnswers, null, 2)}
          </pre>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 cn-display text-xl">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-white/45">{label}</dt>
      <dd className="mt-0.5">{value || "—"}</dd>
    </div>
  );
}

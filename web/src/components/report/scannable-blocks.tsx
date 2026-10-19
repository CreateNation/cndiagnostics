import { shortenList, toScanBlock } from "@/lib/report/scannable";

export function ScanLead({ text }: { text: string }) {
  const { lead, bullets } = toScanBlock(text);
  if (!lead && !bullets.length) return null;

  return (
    <div className="space-y-4">
      {lead ? (
        <p className="text-xl font-medium leading-snug tracking-tight text-[var(--cn-ink)] sm:text-2xl">
          {lead}
        </p>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="space-y-2.5">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex gap-3 rounded-lg bg-[color-mix(in_srgb,var(--cn-paper)_70%,white)] px-3.5 py-2.5 text-[0.95rem] leading-snug text-[var(--cn-ink)]/80"
            >
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cn-red)]"
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ChipRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--cn-line)] bg-white px-3.5 py-1.5"
        >
          <span className="cn-display text-[9px] tracking-[0.16em] text-[var(--cn-muted)]">
            {item.label}
          </span>
          <span className="text-sm font-medium text-[var(--cn-ink)]">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function VisualList({
  items,
  tone = "default",
  max = 4,
}: {
  items: string[];
  tone?: "default" | "good" | "warn";
  max?: number;
}) {
  const list = shortenList(items, max);
  if (!list.length) return null;

  const mark =
    tone === "good"
      ? "bg-emerald-600"
      : tone === "warn"
        ? "bg-[var(--cn-red)]"
        : "bg-[var(--cn-red)]";

  return (
    <ul className="mt-4 space-y-2.5">
      {list.map((item) => (
        <li
          key={item}
          className="flex gap-3 rounded-lg border border-[var(--cn-line)] bg-white px-3.5 py-3 text-[0.95rem] leading-snug text-[var(--cn-ink)]"
        >
          <span
            aria-hidden
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${mark}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MilestoneCard({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  const { lead, bullets } = toScanBlock(detail);
  return (
    <div className="rounded-[0.9rem] border border-[var(--cn-line)] bg-[var(--cn-charcoal)] px-5 py-6 text-white">
      <p className="cn-display text-[10px] tracking-[0.2em] text-[var(--cn-red)]">
        Milestone
      </p>
      <p className="cn-display mt-2 text-xl leading-snug sm:text-2xl">{title}</p>
      {lead ? (
        <p className="mt-4 text-base leading-snug text-white/70">{lead}</p>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm text-white/55">
              <span aria-hidden className="text-[var(--cn-red)]">
                →
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CostBanner({
  narrative,
  note,
}: {
  narrative: string;
  note: string;
}) {
  const { lead, bullets } = toScanBlock(narrative);
  return (
    <div className="overflow-hidden rounded-[0.9rem] border border-[var(--cn-red)]/35 bg-[color-mix(in_srgb,var(--cn-red)_8%,white)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--cn-red)]/20 px-4 py-3">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--cn-red)] text-xs font-bold text-white"
        >
          !
        </span>
        <span className="cn-display text-sm tracking-[0.14em] text-[var(--cn-red)]">
          If nothing changes
        </span>
      </div>
      <div className="space-y-3 px-4 py-4">
        {lead ? (
          <p className="text-lg font-medium leading-snug text-[var(--cn-ink)]">
            {lead}
          </p>
        ) : null}
        {bullets.length > 0 ? (
          <ul className="space-y-2">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex gap-2 text-sm leading-snug text-[var(--cn-ink)]/75"
              >
                <span aria-hidden className="text-[var(--cn-red)]">
                  •
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {note ? (
          <p className="text-xs text-[var(--cn-muted)]">{note}</p>
        ) : null}
      </div>
    </div>
  );
}

export function NoteChip({ text }: { text: string }) {
  const { lead } = toScanBlock(text);
  if (!lead) return null;
  return (
    <p className="mt-4 inline-block rounded-md border border-[var(--cn-line)] bg-white px-3 py-2 text-xs leading-snug text-[var(--cn-muted)]">
      {lead}
    </p>
  );
}

/**
 * Featured “Where the leak is” block — darker, slower read, numbered leaks.
 */
export function LeakSpotlight({
  index,
  diagnosis,
  leakPoints,
}: {
  index: string;
  diagnosis: string;
  leakPoints: string[];
}) {
  const { lead, bullets } = toScanBlock(diagnosis);
  const points = shortenList(
    [...leakPoints, ...bullets.filter((b) => !leakPoints.includes(b))],
    4,
  );

  return (
    <section className="relative mb-5 scroll-mt-6 overflow-hidden rounded-[1.1rem] border-2 border-[var(--cn-red)] bg-[var(--cn-charcoal)] text-white shadow-[0_18px_50px_rgba(228,67,54,0.18)] sm:mb-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--cn-red)]/25 blur-3xl"
      />
      <div
        aria-hidden
        className="cn-arc-pattern pointer-events-none absolute inset-0 opacity-40"
      />

      <div className="relative border-b border-white/10 px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="cn-display text-xs tracking-[0.2em] text-[var(--cn-red)]">
              {index}
            </span>
            <h2 className="cn-display text-xl tracking-wide sm:text-2xl">
              Where the leak is
            </h2>
          </div>
          <span className="rounded-full border border-[var(--cn-red)]/50 bg-[var(--cn-red)]/15 px-3 py-1 cn-display text-[9px] tracking-[0.18em] text-[var(--cn-red)]">
            Read carefully
          </span>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-snug text-white/55">
          This is the most important part of your report. Fix this first.
        </p>
      </div>

      <div className="relative space-y-6 px-5 py-7 sm:px-8 sm:py-9">
        {lead ? (
          <blockquote className="border-l-4 border-[var(--cn-red)] pl-4 sm:pl-5">
            <p className="text-2xl font-medium leading-snug tracking-tight text-white sm:text-[1.75rem]">
              {lead}
            </p>
          </blockquote>
        ) : null}

        {points.length > 0 ? (
          <ol className="space-y-3">
            {points.map((point, i) => (
              <li
                key={point}
                className="flex gap-4 rounded-[0.75rem] border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cn-red)] cn-display text-sm text-white">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 pt-1.5">
                  <p className="cn-display text-[10px] tracking-[0.16em] text-white/40">
                    Leak point
                  </p>
                  <p className="mt-1 text-base leading-snug text-white/90 sm:text-lg">
                    {point}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}

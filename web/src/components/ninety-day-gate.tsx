"use client";

export function NinetyDayGate({
  bookingHref,
  children,
}: {
  bookingHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1rem] border border-[var(--cn-line)] bg-white">
      <div
        aria-hidden
        className="pointer-events-none select-none px-6 py-8 blur-[7px] opacity-55"
      >
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--cn-paper)_55%,transparent)] px-6 py-10 backdrop-blur-[2px]">
        <div className="w-full max-w-md text-center">
          <p className="cn-display text-xs tracking-[0.24em] text-[var(--cn-red)]">
            Locked section
          </p>
          <h3 className="cn-display mt-3 text-2xl leading-tight text-[var(--cn-ink)] sm:text-3xl">
            Want the full 90-day path?
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[var(--cn-muted)]">
            Book a complimentary strategy call and we&apos;ll walk you through
            the full plan tailored to your bottleneck.
          </p>

          <a
            href={bookingHref}
            target="_blank"
            rel="noreferrer"
            className="cn-btn mt-6 w-full sm:w-auto"
          >
            Book a complimentary call
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

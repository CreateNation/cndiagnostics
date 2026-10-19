import { TrackedLink } from "@/components/analytics/tracked-link";

type SoftCtaProps = {
  href: string;
  submissionId: string;
  source: string;
  enabled: boolean;
  variant?: "whisper" | "card" | "accent";
  eyebrow?: string;
  title: string;
  body?: string;
  buttonLabel?: string;
};

/** Crisp primary CTA — matches site buttons, no glow/pill clutter. */
function CtaButton({
  href,
  source,
  submissionId,
  label,
  onDark = false,
}: {
  href: string;
  source: string;
  submissionId: string;
  label: string;
  onDark?: boolean;
}) {
  return (
    <div className="w-full shrink-0 sm:w-auto">
      <TrackedLink
        href={href}
        source={source}
        submissionId={submissionId}
        className="cn-btn w-full justify-center sm:w-auto"
      >
        <span>{label}</span>
        <span aria-hidden>↗</span>
      </TrackedLink>
      <p
        className={`mt-2 text-center text-[11px] leading-snug sm:text-left ${
          onDark ? "text-white/45" : "text-[var(--cn-muted)]"
        }`}
      >
        Free · 20 min · No obligation
      </p>
    </div>
  );
}

/**
 * Soft mid-report booking invites — clean layout, one clear button.
 */
export function SoftCta({
  href,
  submissionId,
  source,
  enabled,
  variant = "whisper",
  eyebrow = "Optional next step",
  title,
  body,
  buttonLabel = "Book a short call with Luay",
}: SoftCtaProps) {
  if (!enabled) return null;

  if (variant === "whisper") {
    return (
      <aside className="mb-5 rounded-[0.9rem] border border-[var(--cn-line)] bg-white px-5 py-5 sm:mb-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="min-w-0 sm:max-w-md">
          <p className="cn-display text-[9px] tracking-[0.18em] text-[var(--cn-red)]">
            {eyebrow}
          </p>
          <p className="mt-1.5 text-base leading-snug text-[var(--cn-ink)] sm:text-lg">
            {title}
          </p>
          {body ? (
            <p className="mt-1.5 text-sm leading-snug text-[var(--cn-muted)]">
              {body}
            </p>
          ) : null}
        </div>
        <div className="mt-4 shrink-0 sm:mt-0">
          <CtaButton
            href={href}
            source={source}
            submissionId={submissionId}
            label={buttonLabel}
          />
        </div>
      </aside>
    );
  }

  if (variant === "accent") {
    return (
      <aside className="mb-5 rounded-[1rem] border border-[var(--cn-red)]/20 bg-[color-mix(in_srgb,var(--cn-red)_5%,white)] px-5 py-6 sm:mb-6 sm:px-7 sm:py-7">
        <p className="cn-display text-[10px] tracking-[0.2em] text-[var(--cn-red)]">
          {eyebrow}
        </p>
        <p className="mt-2 max-w-lg text-xl leading-snug text-[var(--cn-ink)] sm:text-2xl">
          {title}
        </p>
        {body ? (
          <p className="mt-2 max-w-md text-sm leading-snug text-[var(--cn-muted)]">
            {body}
          </p>
        ) : null}
        <div className="mt-5">
          <CtaButton
            href={href}
            source={source}
            submissionId={submissionId}
            label={buttonLabel}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative mb-5 overflow-hidden rounded-[1rem] bg-[var(--cn-charcoal)] px-5 py-7 text-white sm:mb-6 sm:px-7 sm:py-8">
      <div
        aria-hidden
        className="cn-arc-pattern pointer-events-none absolute inset-0 opacity-40"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="max-w-md">
          <p className="cn-display text-[10px] tracking-[0.2em] text-[var(--cn-red)]">
            {eyebrow}
          </p>
          <p className="mt-2 text-xl leading-snug sm:text-2xl">{title}</p>
          {body ? (
            <p className="mt-2 text-sm leading-snug text-white/60">{body}</p>
          ) : null}
        </div>
        <CtaButton
          href={href}
          source={source}
          submissionId={submissionId}
          label={buttonLabel}
          onDark
        />
      </div>
    </aside>
  );
}

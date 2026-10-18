import Link from "next/link";

/**
 * Brand PNGs are 1500×1500 with transparent padding.
 * Content bbox ≈ (122,313)–(1377,1186) → ~1255×873 (aspect ≈ 1.44).
 * Clip a viewport to that wordmark so padding doesn’t make it look tiny.
 */
const WORDMARK_ASPECT = 1255 / 873;
const CANVAS_SCALE = 1500 / 873;

type LogoSize = "sm" | "md" | "lg" | "footer";

const LOGO_HEIGHT_CLASS: Record<LogoSize, string> = {
  sm: "h-10 sm:h-11",
  md: "h-14 sm:h-16",
  lg: "h-24 sm:h-28 md:h-32",
  // Match hero presence on mobile — stacked wordmark needs height, not a stamp.
  footer: "h-24 w-[calc(6rem*1.437)] sm:h-16 sm:w-[calc(4rem*1.437)]",
};

export function BrandLogo({
  tone = "dark",
  size = "md",
  className = "",
}: {
  tone?: "dark" | "light";
  size?: LogoSize;
  className?: string;
}) {
  const lightBg = tone === "light";

  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden ${LOGO_HEIGHT_CLASS[size]} ${className}`}
      style={
        size === "footer"
          ? undefined
          : { aspectRatio: String(WORDMARK_ASPECT) }
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- need absolute scale clip; next/image fights this */}
      <img
        src={lightBg ? "/brand/logo.png" : "/brand/logo-white.png"}
        alt="Create Nation"
        width={1500}
        height={1500}
        className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 select-none object-contain"
        style={{
          height: `${CANVAS_SCALE * 100}%`,
          width: `${CANVAS_SCALE * 100}%`,
        }}
        decoding="async"
      />
    </span>
  );
}

export function SiteHeader({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 md:py-6">
        <Link
          href="/"
          className="shrink-0 opacity-95 transition duration-300 hover:opacity-100"
        >
          <BrandLogo tone={tone} size="md" />
        </Link>
        <a
          href="https://create-nation.com"
          className={`cn-display max-w-[50%] truncate text-[9px] tracking-[0.18em] transition sm:text-[10px] sm:tracking-[0.24em] ${
            light
              ? "text-[var(--cn-muted)] hover:text-[var(--cn-ink)]"
              : "text-white/50 hover:text-white"
          }`}
          target="_blank"
          rel="noreferrer"
        >
          create-nation.com
        </a>
      </div>
    </header>
  );
}

export function SiteFooter({
  tone = "light",
}: {
  tone?: "dark" | "light";
}) {
  const dark = tone === "dark";
  return (
    <footer
      className={`mt-auto border-t ${
        dark
          ? "border-white/10 bg-[var(--cn-charcoal)] text-white/45"
          : "border-[var(--cn-line)] bg-white text-[var(--cn-muted)]"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-8 sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-3">
          <BrandLogo tone={dark ? "dark" : "light"} size="footer" />
          <p className="cn-display text-[10px] tracking-[0.16em] sm:text-xs sm:tracking-[0.18em]">
            Create Nation © {new Date().getFullYear()}
          </p>
        </div>
        <p className="max-w-[17rem] text-pretty text-[11px] leading-relaxed tracking-wide sm:max-w-sm sm:text-xs">
          Bridging the gap between creativity and results
        </p>
      </div>
    </footer>
  );
}

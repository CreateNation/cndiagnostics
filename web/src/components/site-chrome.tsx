import Image from "next/image";
import Link from "next/link";

/** Brand assets are square canvases (1500×1500) — never force a wide aspect ratio. */
const LOGO_PX = {
  sm: 44,
  md: 64,
  lg: 108,
} as const;

const LOGO_CLASS = {
  // Square brand canvases need enough pixels for the wordmark to stay legible.
  sm: "h-11 w-11",
  md: "h-12 w-12 sm:h-16 sm:w-16",
  lg: "h-20 w-20 sm:h-24 sm:w-24 md:h-[6.75rem] md:w-[6.75rem]",
} as const;

export function BrandLogo({
  tone = "dark",
  size = "md",
  className = "",
}: {
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const lightBg = tone === "light";
  const px = LOGO_PX[size];

  return (
    <Image
      src={lightBg ? "/brand/logo.png" : "/brand/logo-white.png"}
      alt="Create Nation"
      width={px}
      height={px}
      className={`shrink-0 object-contain ${LOGO_CLASS[size]} ${className}`}
      priority={size === "lg"}
    />
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
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2.5 px-4 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-8 sm:text-left">
        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
          <BrandLogo tone={dark ? "dark" : "light"} size="sm" />
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

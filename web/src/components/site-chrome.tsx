import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  tone = "dark",
  size = "md",
}: {
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const lightBg = tone === "light";
  const height = size === "lg" ? 108 : size === "sm" ? 48 : 72;
  const width = Math.round(height * 3.4);

  return (
    <Image
      src={lightBg ? "/brand/logo.png" : "/brand/logo-white.png"}
      alt="Create Nation"
      width={width}
      height={height}
      className="h-auto w-auto max-w-[min(100%,20rem)]"
      style={{ height, width: "auto" }}
      priority
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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:py-6">
        <Link
          href="/"
          className="opacity-95 transition duration-300 hover:opacity-100"
        >
          <BrandLogo tone={tone} size="lg" />
        </Link>
        <a
          href="https://create-nation.com"
          className={`cn-display text-[10px] tracking-[0.24em] transition ${
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
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-9 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <BrandLogo tone={dark ? "dark" : "light"} size="sm" />
          <p className="cn-display text-xs tracking-[0.18em]">
            Create Nation © {new Date().getFullYear()}
          </p>
        </div>
        <p className="text-xs tracking-wide">
          Bridging the gap between creativity and results
        </p>
      </div>
    </footer>
  );
}

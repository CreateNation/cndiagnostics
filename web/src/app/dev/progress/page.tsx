import Link from "next/link";
import { ReportGeneratingLoader } from "@/components/report-generating-loader";

/**
 * Local/UI preview of the report progress bar — no quiz or payment needed.
 * Open: /dev/progress  or  /dev/progress?tone=light
 */
export default async function ProgressPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tone?: string }>;
}) {
  const { tone: toneParam } = await searchParams;
  const tone = toneParam === "light" ? "light" : "dark";
  const dark = tone === "dark";

  return (
    <div
      className={`flex min-h-full flex-col ${
        dark
          ? "bg-[var(--cn-charcoal)] text-white"
          : "bg-[var(--cn-paper)] text-[var(--cn-ink)]"
      }`}
    >
      <header
        className={`border-b px-6 py-4 ${
          dark ? "border-white/10" : "border-[var(--cn-line)]"
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <p className="cn-display text-[11px] tracking-[0.2em] text-[var(--cn-red)]">
            Progress preview
          </p>
          <div className="flex gap-3 text-xs tracking-wide">
            <Link
              href="/dev/progress"
              className={tone === "dark" ? "underline" : "opacity-50"}
            >
              Dark
            </Link>
            <Link
              href="/dev/progress?tone=light"
              className={tone === "light" ? "underline" : "opacity-50"}
            >
              Light
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="cn-display text-[11px] tracking-[0.24em] text-[var(--cn-red)]">
          Create Nation Diagnostic
        </p>
        <h1 className="cn-display mt-3 text-3xl leading-tight sm:text-4xl">
          Building your diagnosis
        </h1>
        <ReportGeneratingLoader tone={tone} />
      </main>
    </div>
  );
}

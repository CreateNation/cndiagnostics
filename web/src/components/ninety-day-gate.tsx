"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NinetyDayGate({
  token,
  unlocked,
  bookingHref,
  children,
}: {
  token: string;
  unlocked: boolean;
  bookingHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(unlocked);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/report/${token}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { error?: string; unlocked?: boolean };
      if (!res.ok || !data.unlocked) {
        throw new Error(data.error || "Invalid unlock code");
      }
      setOpen(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setLoading(false);
    }
  }

  if (open) {
    return <>{children}</>;
  }

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
            it. During the call, we&apos;ll give you a code to unlock this
            section.
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

          <div className="mt-8 border-t border-[var(--cn-line)] pt-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--cn-muted)]">
              Have an unlock code?
            </p>
            <form
              onSubmit={unlock}
              className="mt-3 flex flex-col gap-2 sm:flex-row"
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="cn-input-light flex-1 text-center tracking-[0.2em]"
                autoComplete="off"
                maxLength={12}
              />
              <button
                type="submit"
                disabled={loading || code.trim().length < 4}
                className="cn-btn shrink-0"
              >
                {loading ? "Unlocking…" : "Unlock"}
              </button>
            </form>
            {error && (
              <p className="mt-2 text-sm text-[var(--cn-red)]">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Reading your answers",
  "Mapping audience & positioning",
  "Stress-testing the offer",
  "Tracing the funnel leak",
  "Scoring content & demand",
  "Checking systems & tracking",
  "Pinning the primary bottleneck",
  "Drafting your 90-day path",
  "Polishing the diagnosis",
];

export function ReportGeneratingLoader({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 2800);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 94) return 94;
        const bump = p < 35 ? 2.4 : p < 65 ? 1.4 : p < 85 ? 0.6 : 0.22;
        return Math.min(94, p + bump);
      });
    }, 400);
    return () => clearInterval(progressTimer);
  }, []);

  const light = tone === "light";
  const pct = Math.round(progress);

  return (
    <div
      className="mx-auto mt-10 w-full max-w-md animate-fade-up-late"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Generating your report, ${pct} percent`}
    >
      {/* Dial */}
      <div className="relative mx-auto h-36 w-36 sm:h-40 sm:w-40">
        <div
          aria-hidden
          className="absolute inset-5 rounded-full bg-[var(--cn-red)]/12 blur-xl animate-pulse-soft"
        />
        <div
          aria-hidden
          className={`absolute inset-0 rounded-full border ${
            light ? "border-[var(--cn-line)]" : "border-white/10"
          }`}
        />
        <div
          aria-hidden
          className="absolute inset-[10%] rounded-full cn-loader-spin"
          style={{
            background:
              "conic-gradient(from 210deg, transparent 0deg, transparent 240deg, color-mix(in srgb, var(--cn-red) 75%, transparent) 300deg, transparent 360deg)",
            maskImage:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            WebkitMaskImage:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />
        <div
          className={`absolute inset-[22%] flex flex-col items-center justify-center rounded-full border border-[var(--cn-red)]/40 ${
            light ? "bg-white" : "bg-[var(--cn-charcoal)]"
          }`}
        >
          <span
            className={`cn-display text-3xl leading-none tracking-tight ${
              light ? "text-[var(--cn-ink)]" : "text-white"
            }`}
          >
            {pct}
          </span>
          <span
            className={`mt-1 text-[10px] uppercase tracking-[0.2em] ${
              light ? "text-[var(--cn-muted)]" : "text-white/45"
            }`}
          >
            complete
          </span>
        </div>
      </div>

      {/* Status + bar */}
      <div className="mt-8 text-center">
        <p
          className={`cn-display text-[11px] tracking-[0.2em] ${
            light ? "text-[var(--cn-muted)]" : "text-white/45"
          }`}
        >
          Step {step + 1} of {STEPS.length}
        </p>
        <p
          key={step}
          className={`cn-display mt-2 min-h-[1.4rem] text-base tracking-[0.04em] transition-opacity duration-500 sm:text-lg ${
            light ? "text-[var(--cn-ink)]" : "text-white"
          }`}
        >
          {STEPS[step]}
        </p>

        <div
          className={`mt-6 h-1.5 w-full overflow-hidden rounded-full ${
            light ? "bg-[var(--cn-line)]" : "bg-white/10"
          }`}
        >
          <div
            className="h-full rounded-full bg-[var(--cn-red)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className={`mt-3 flex items-center justify-between text-[11px] tracking-[0.14em] uppercase ${
            light ? "text-[var(--cn-muted)]" : "text-white/40"
          }`}
        >
          <span>Building diagnosis</span>
          <span>{pct}%</span>
        </div>

        <p
          className={`mt-5 text-sm leading-relaxed ${
            light ? "text-[var(--cn-muted)]" : "text-white/50"
          }`}
        >
          Usually under a minute. Please keep this tab open.
        </p>
      </div>

      {/* Step rail */}
      <div
        className="mt-8 flex items-center justify-center gap-1.5"
        aria-hidden
      >
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i < step
                ? "w-3 bg-[var(--cn-red)]"
                : i === step
                  ? "w-5 bg-[var(--cn-red)]"
                  : light
                    ? "w-1.5 bg-[var(--cn-line)]"
                    : "w-1.5 bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

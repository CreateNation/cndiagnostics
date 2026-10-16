"use client";

import { useEffect, useState, type CSSProperties } from "react";

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
      setStep((s) => (s + 1) % STEPS.length);
    }, 2200);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 94) return 94;
        const bump = p < 35 ? 2.8 : p < 65 ? 1.6 : p < 85 ? 0.7 : 0.25;
        return Math.min(94, p + bump);
      });
    }, 350);
    return () => clearInterval(progressTimer);
  }, []);

  const light = tone === "light";
  const trackBg = light ? "bg-[var(--cn-line)]" : "bg-white/12";
  const stepColor = light ? "text-[var(--cn-ink)]" : "text-white/85";
  const metaColor = light ? "text-[var(--cn-muted)]" : "text-white/40";
  const pctColor = light ? "text-[var(--cn-ink)]" : "text-white/70";

  return (
    <div
      className="mt-10 animate-fade-up-late"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Generating your report, ${Math.round(progress)} percent`}
    >
      <div className="relative mx-auto h-44 w-44 sm:h-52 sm:w-52">
        <div
          aria-hidden
          className="absolute inset-6 rounded-full bg-[var(--cn-red)]/15 blur-2xl animate-pulse-soft"
        />

        <div
          aria-hidden
          className={`absolute inset-0 rounded-full border ${
            light ? "border-[var(--cn-line)]" : "border-white/10"
          }`}
        />
        <div
          aria-hidden
          className={`absolute inset-[14%] rounded-full border border-dashed cn-loader-spin-slow ${
            light ? "border-[var(--cn-ink)]/20" : "border-white/18"
          }`}
        />
        <div
          aria-hidden
          className={`absolute inset-[28%] rounded-full border ${
            light ? "border-[var(--cn-line)]" : "border-white/12"
          }`}
        />

        <div
          aria-hidden
          className="absolute inset-0 cn-loader-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 250deg, color-mix(in srgb, var(--cn-red) 70%, transparent) 310deg, transparent 360deg)",
            borderRadius: "9999px",
            maskImage:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            WebkitMaskImage:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />

        {[0, 72, 144, 216, 288].map((deg) => (
          <span
            key={deg}
            aria-hidden
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--cn-red)] cn-loader-orbit"
            style={
              {
                "--orbit-deg": `${deg}deg`,
                animationDelay: `${(deg / 72) * 0.12}s`,
              } as CSSProperties
            }
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-full border border-[var(--cn-red)]/50 shadow-[0_0_40px_color-mix(in_srgb,var(--cn-red)_35%,transparent)] sm:h-[4.5rem] sm:w-[4.5rem] ${
              light ? "bg-white" : "bg-[var(--cn-charcoal)]"
            }`}
          >
            <span
              aria-hidden
              className="absolute inset-2 rounded-full border border-[var(--cn-red)]/30 animate-pulse-soft"
            />
            <span className={`cn-display text-lg tracking-tight ${pctColor}`}>
              {Math.round(progress)}
              <span className="text-[10px]">%</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-md">
        <p
          className={`cn-display min-h-[1.5rem] text-sm tracking-[0.12em] transition-opacity duration-500 ${stepColor}`}
        >
          {STEPS[step]}
          <span className="cn-loader-dots text-[var(--cn-red)]" aria-hidden>
            …
          </span>
        </p>

        <div className={`mt-5 h-2 overflow-hidden rounded-full ${trackBg}`}>
          <div
            className="h-full rounded-full bg-[var(--cn-red)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p
          className={`mt-3 text-xs uppercase tracking-[0.16em] ${metaColor}`}
        >
          Building your diagnosis · usually under a minute — please keep this tab open
        </p>
      </div>
    </div>
  );
}

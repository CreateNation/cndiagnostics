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

export function ReportGeneratingLoader() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 2200);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return 92;
        const bump = p < 40 ? 2.4 : p < 70 ? 1.4 : 0.55;
        return Math.min(92, p + bump);
      });
    }, 400);
    return () => clearInterval(progressTimer);
  }, []);

  return (
    <div
      className="mt-10 animate-fade-up-late"
      role="status"
      aria-live="polite"
      aria-label="Generating your report"
    >
      <div className="relative mx-auto h-44 w-44 sm:h-52 sm:w-52">
        {/* Outer glow */}
        <div
          aria-hidden
          className="absolute inset-6 rounded-full bg-[var(--cn-red)]/15 blur-2xl animate-pulse-soft"
        />

        {/* Rings */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute inset-[14%] rounded-full border border-dashed border-white/18 cn-loader-spin-slow"
        />
        <div
          aria-hidden
          className="absolute inset-[28%] rounded-full border border-white/12"
        />

        {/* Sweep arc */}
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

        {/* Orbiting ticks */}
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

        {/* Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[var(--cn-red)]/50 bg-[var(--cn-charcoal)] shadow-[0_0_40px_color-mix(in_srgb,var(--cn-red)_35%,transparent)] sm:h-[4.5rem] sm:w-[4.5rem]">
            <span
              aria-hidden
              className="absolute inset-2 rounded-full border border-[var(--cn-red)]/30 animate-pulse-soft"
            />
            <span className="cn-display text-[11px] tracking-[0.28em] text-[var(--cn-red)]">
              CN
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-md">
        <p className="cn-display min-h-[1.5rem] text-sm tracking-[0.12em] text-white/85 transition-opacity duration-500">
          {STEPS[step]}
          <span className="cn-loader-dots text-[var(--cn-red)]" aria-hidden>
            …
          </span>
        </p>

        <div className="mt-5 h-[3px] overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-[var(--cn-red)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-xs tracking-[0.16em] text-white/40 uppercase">
          Building your diagnosis · usually under a minute
        </p>
      </div>
    </div>
  );
}

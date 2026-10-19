"use client";

import type { DimensionScores } from "@/lib/types";

const DIM_ORDER = [
  "audience",
  "offer",
  "funnel",
  "content",
  "systems",
] as const;

const DIM_SHORT: Record<(typeof DIM_ORDER)[number], string> = {
  audience: "Audience",
  offer: "Offer",
  funnel: "Funnel",
  content: "Content",
  systems: "Systems",
};

const DIM_FULL: Record<(typeof DIM_ORDER)[number], string> = {
  audience: "Audience & Positioning",
  offer: "Offer Strength",
  funnel: "Funnel & Conversion",
  content: "Content & Demand",
  systems: "Systems & Tracking",
};

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}

function scoreTone(score: number): string {
  if (score >= 70) return "var(--cn-ink)";
  if (score >= 45) return "var(--cn-red)";
  return "var(--cn-red)";
}

/** Polar radar of the five dimension scores. */
export function DimensionRadar({ dimensions }: { dimensions: DimensionScores }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 96;
  const n = DIM_ORDER.length;

  const point = (i: number, value: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (clampScore(value) / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const ring = (pct: number) => {
    const pts = DIM_ORDER.map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const r = (pct / 100) * radius;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });
    return pts.join(" ");
  };

  const dataPts = DIM_ORDER.map((key, i) => point(i, dimensions[key] ?? 0));
  const dataPoly = dataPts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full max-w-[17.5rem]"
        role="img"
        aria-label="Dimension score radar chart"
      >
        {[25, 50, 75, 100].map((pct) => (
          <polygon
            key={pct}
            points={ring(pct)}
            fill="none"
            stroke="var(--cn-line)"
            strokeWidth={pct === 100 ? 1.25 : 1}
          />
        ))}
        {DIM_ORDER.map((_, i) => {
          const tip = point(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={tip.x}
              y2={tip.y}
              stroke="var(--cn-line)"
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={dataPoly}
          fill="color-mix(in srgb, var(--cn-red) 22%, transparent)"
          stroke="var(--cn-red)"
          strokeWidth={2.25}
          strokeLinejoin="round"
        />
        {dataPts.map((p, i) => (
          <circle
            key={DIM_ORDER[i]}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="var(--cn-red)"
          />
        ))}
        {DIM_ORDER.map((key, i) => {
          const tip = point(i, 118);
          return (
            <text
              key={key}
              x={tip.x}
              y={tip.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--cn-muted)]"
              style={{ fontSize: 11, fontFamily: "var(--font-display)" }}
            >
              {DIM_SHORT[key]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** Horizontal score bars with large numerals. */
export function DimensionBars({ dimensions }: { dimensions: DimensionScores }) {
  return (
    <ul className="space-y-5">
      {DIM_ORDER.map((key) => {
        const score = clampScore(dimensions[key] ?? 0);
        return (
          <li key={key}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="cn-display text-[11px] tracking-[0.14em] text-[var(--cn-ink)] sm:text-xs">
                {DIM_FULL[key]}
              </span>
              <span
                className="cn-display text-xl tabular-nums sm:text-2xl"
                style={{ color: scoreTone(score) }}
              >
                {Math.round(score)}
                <span className="ml-0.5 text-xs text-[var(--cn-muted)]">
                  /100
                </span>
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-sm bg-[var(--cn-line)]">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-[var(--cn-red)] transition-[width] duration-700 ease-out"
                style={{ width: `${score}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Compact donut for a single highlighted metric (e.g. stage confidence proxy). */
export function ScoreDonut({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const value = clampScore(score);
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 108 108"
        className="h-24 w-24"
        role="img"
        aria-label={`${label}: ${Math.round(value)} out of 100`}
      >
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke="var(--cn-line)"
          strokeWidth="8"
        />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke="var(--cn-red)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 54 54)"
        />
        <text
          x="54"
          y="52"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--cn-ink)]"
          style={{
            fontSize: 22,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
          }}
        >
          {Math.round(value)}
        </text>
      </svg>
      <p className="cn-display text-[10px] tracking-[0.18em] text-[var(--cn-muted)]">
        {label}
      </p>
    </div>
  );
}

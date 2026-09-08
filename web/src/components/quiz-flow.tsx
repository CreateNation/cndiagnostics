"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";
import type { AnswerValue, Answers } from "@/lib/types";

export function QuizFlow({
  submissionId,
  initialAnswers,
  unlocked,
}: {
  submissionId: string;
  initialAnswers: Answers;
  unlocked: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

  const question = QUESTIONS[index];
  const progress = ((index + 1) / QUESTIONS.length) * 100;

  useEffect(() => {
    if (!unlocked || started) return;
    setStarted(true);
    void fetch(`/api/quiz/${submissionId}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "quiz_started" }),
    });
  }, [unlocked, started, submissionId]);

  useEffect(() => {
    if (!started) return;
    if ((index + 1) % 5 === 0) {
      void fetch(`/api/quiz/${submissionId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "quiz_progressed",
          questionIndex: index,
          answers,
        }),
      });
    }
  }, [index, started, submissionId, answers]);

  const currentValue = answers[question.id];
  const canContinue = useMemo(() => {
    if (!question.required) return true;
    if (question.type === "multi") {
      return Array.isArray(currentValue) && currentValue.length > 0;
    }
    if (question.type === "email") {
      return typeof currentValue === "string" && currentValue.includes("@");
    }
    return currentValue !== undefined && currentValue !== "";
  }, [currentValue, question]);

  function setValue(value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    setError(null);
  }

  function toggleMulti(optionValue: string) {
    const prev = Array.isArray(answers[question.id])
      ? [...(answers[question.id] as string[])]
      : [];
    let next: string[];
    if (optionValue === "none") {
      next = prev.includes("none") ? [] : ["none"];
    } else {
      next = prev.filter((v) => v !== "none");
      if (next.includes(optionValue)) {
        next = next.filter((v) => v !== optionValue);
      } else {
        next = [...next, optionValue];
      }
    }
    setValue(next);
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${submissionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      router.push(`/bridge/${submissionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
      setSubmitting(false);
    }
  }

  function next() {
    if (!canContinue) {
      setError("Please answer this question to continue.");
      return;
    }
    if (index === QUESTIONS.length - 1) {
      void finish();
      return;
    }
    setIndex((i) => i + 1);
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-lg px-2 py-6">
        <p className="cn-display text-xs tracking-[0.24em] text-[var(--cn-red)]">
          Locked
        </p>
        <h1 className="cn-display mt-3 text-3xl text-[var(--cn-ink)]">
          Payment required
        </h1>
        <p className="mt-3 text-[var(--cn-muted)]">
          Complete the $9 checkout to unlock your diagnostic quiz.
        </p>
        <a href="/" className="cn-btn mt-8 inline-flex">
          Back to start
          <span aria-hidden>↗</span>
        </a>
      </div>
    );
  }

  const optionClass = (selected: boolean) =>
    `group relative flex w-full items-start overflow-hidden rounded-[var(--radius-btn)] border px-4 py-3.5 text-left transition duration-200 ${
      selected
        ? "border-[var(--cn-red)] bg-[color-mix(in_srgb,var(--cn-red)_6%,white)] shadow-[inset_3px_0_0_0_var(--cn-red)]"
        : "border-[var(--cn-line)] bg-white hover:border-[var(--cn-ink)]/35"
    }`;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-[var(--cn-muted)]">
          <span className="cn-display tracking-[0.18em] text-[var(--cn-ink)]">
            {String(index + 1).padStart(2, "0")}
            <span className="text-[var(--cn-muted)]">
              {" "}
              / {String(QUESTIONS.length).padStart(2, "0")}
            </span>
          </span>
          <span className="truncate text-right text-[var(--cn-ink)]/65">
            {question.section}
          </span>
        </div>
        <div className="h-[3px] overflow-hidden rounded-full bg-[var(--cn-line)]">
          <div
            className="h-full origin-left rounded-full bg-[var(--cn-red)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={question.id} className="animate-fade-up">
        <h1 className="cn-display text-2xl leading-[1.15] text-[var(--cn-ink)] sm:text-[2.15rem]">
          {question.prompt}
        </h1>
        {question.helpText && (
          <p className="mt-3 text-sm leading-relaxed text-[var(--cn-muted)]">
            {question.helpText}
          </p>
        )}

        <div className="mt-8 space-y-2.5">
          {question.type === "email" && (
            <input
              type="email"
              value={typeof currentValue === "string" ? currentValue : ""}
              onChange={(e) => setValue(e.target.value)}
              placeholder="you@company.com"
              className="cn-input-light"
            />
          )}

          {question.type === "dropdown" && (
            <select
              value={typeof currentValue === "string" ? currentValue : ""}
              onChange={(e) => setValue(e.target.value)}
              className="cn-input-light"
            >
              <option value="">Select…</option>
              {question.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {(question.type === "single" || question.type === "scale") &&
            question.options?.map((opt) => {
              const selected = currentValue === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue(opt.value)}
                  className={optionClass(selected)}
                >
                  <span
                    className={`mr-3 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border transition ${
                      selected
                        ? "border-[var(--cn-red)] bg-[var(--cn-red)]"
                        : "border-[var(--cn-line)] group-hover:border-[var(--cn-ink)]/40"
                    }`}
                  />
                  <span className="leading-snug text-[var(--cn-ink)]">
                    {opt.label}
                  </span>
                </button>
              );
            })}

          {question.type === "multi" &&
            question.options?.map((opt) => {
              const selected =
                Array.isArray(currentValue) &&
                currentValue.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleMulti(opt.value)}
                  className={optionClass(selected)}
                >
                  <span
                    className={`mr-3 mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] transition ${
                      selected
                        ? "border-[var(--cn-red)] bg-[var(--cn-red)] text-white"
                        : "border-[var(--cn-line)]"
                    }`}
                  >
                    {selected ? "✓" : ""}
                  </span>
                  <span className="leading-snug text-[var(--cn-ink)]">
                    {opt.label}
                  </span>
                </button>
              );
            })}
        </div>

        {error && (
          <p className="mt-4 text-sm text-[var(--cn-red)]">{error}</p>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={index === 0 || submitting}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="cn-display px-2 py-3 text-xs tracking-[0.18em] text-[var(--cn-muted)] transition hover:text-[var(--cn-ink)] disabled:opacity-30"
          >
            Back
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={next}
            className="cn-btn min-w-[11rem]"
          >
            {submitting
              ? "Building report…"
              : index === QUESTIONS.length - 1
                ? "Generate report"
                : "Continue"}
            {!submitting && <span aria-hidden>↗</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

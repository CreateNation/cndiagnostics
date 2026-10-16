"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";
import {
  DIAGNOSTIC_CURRENCY,
  DIAGNOSTIC_PURCHASE_VALUE,
} from "@/lib/analytics/config";

export function CheckoutStart({
  cancelled,
  variant = "glass",
}: {
  cancelled?: boolean;
  variant?: "glass" | "card";
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Work email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid work email.");
      return;
    }

    setLoading(true);
    track("checkout_started", {
      email_present: true,
      phone_present: Boolean(phone),
    });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          name: name || undefined,
          phone: phone || undefined,
        }),
      });
      const raw = await res.text();
      let data: {
        error?: string;
        mode?: string;
        quizUrl?: string;
        checkoutUrl?: string;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        throw new Error(
          raw?.slice(0, 180) || `Checkout failed (${res.status})`,
        );
      }
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.mode === "dev_bypass" && data.quizUrl) {
        track("purchase", {
          transaction_id: `dev_${Date.now()}`,
          value: DIAGNOSTIC_PURCHASE_VALUE,
          currency: DIAGNOSTIC_CURRENCY,
          mode: "dev_bypass",
        });
        router.push(data.quizUrl.replace(/^https?:\/\/[^/]+/, ""));
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const card = variant === "card";

  return (
    <form
      onSubmit={startCheckout}
      className={
        card
          ? "relative w-full overflow-hidden rounded-2xl bg-white p-6 shadow-[0_0_60px_rgba(255,255,255,0.18)] sm:p-8"
          : "relative w-full overflow-hidden rounded-[1rem] border border-white/12 bg-white/[0.04] p-6 backdrop-blur-md sm:p-7"
      }
    >
      {!card && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--cn-red)]/70 to-transparent"
        />
      )}

      <div className="mb-6">
        <p
          className={`cn-display text-[11px] tracking-[0.22em] ${
            card ? "text-[var(--cn-red)]" : "text-[var(--cn-red)]"
          }`}
        >
          Start your assessment
        </p>
        <p
          className={`mt-2 text-sm ${
            card ? "text-[var(--cn-muted)]" : "text-white/55"
          }`}
        >
          $9 · Personalized report by email
        </p>
      </div>

      {cancelled && (
        <p
          className={`mb-4 rounded-[var(--radius-btn)] border px-3 py-2 text-sm ${
            card
              ? "border-[var(--cn-line)] bg-[var(--cn-paper)] text-[var(--cn-ink)]"
              : "border-white/15 bg-white/5 text-white/80"
          }`}
        >
          Checkout cancelled — you can try again anytime.
        </p>
      )}

      <div className="space-y-3">
        <label className="block">
          <span
            className={`mb-1.5 block text-[11px] uppercase tracking-[0.18em] ${
              card ? "text-[var(--cn-muted)]" : "text-white/45"
            }`}
          >
            Name
          </span>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={card ? "cn-input-light" : "cn-input"}
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span
            className={`mb-1.5 block text-[11px] uppercase tracking-[0.18em] ${
              card ? "text-[var(--cn-muted)]" : "text-white/45"
            }`}
          >
            Work email <span className="normal-case tracking-normal">(required)</span>
          </span>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={card ? "cn-input-light" : "cn-input"}
            autoComplete="email"
            required
            aria-required="true"
          />
        </label>
        <label className="block">
          <span
            className={`mb-1.5 block text-[11px] uppercase tracking-[0.18em] ${
              card ? "text-[var(--cn-muted)]" : "text-white/45"
            }`}
          >
            Phone
          </span>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+971 50 000 0000"
            className={card ? "cn-input-light" : "cn-input"}
            autoComplete="tel"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="cn-btn mt-6 w-full text-base uppercase tracking-[0.04em]"
      >
        {loading ? "Opening checkout…" : "Get My Marketing Audit for $9"}
      </button>

      {error && (
        <p
          className={`mt-3 text-sm ${
            card ? "text-[var(--cn-red)]" : "text-red-200"
          }`}
        >
          {error}
        </p>
      )}

      <p
        className={`mt-4 text-center text-xs leading-relaxed ${
          card ? "text-[var(--cn-muted)]" : "text-white/40"
        }`}
      >
        Secure Stripe checkout · Report in minutes · Built for UAE businesses
      </p>
    </form>
  );
}

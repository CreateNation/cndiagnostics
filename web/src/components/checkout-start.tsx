"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";

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
    const trimmedPhone = phone.trim();
    if (!trimmedEmail) {
      setError("Work email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid work email.");
      return;
    }
    if (!trimmedPhone || trimmedPhone.replace(/\D/g, "").length < 7) {
      setError("Phone number is required.");
      return;
    }

    setLoading(true);
    track("checkout_started", {
      email_present: true,
      phone_present: true,
      mode: "free_lead",
    });
    try {
      const cookie = (key: string) => {
        try {
          const match = document.cookie.match(
            new RegExp(`(?:^|; )${key}=([^;]*)`),
          );
          return match ? decodeURIComponent(match[1]) : null;
        } catch {
          return null;
        }
      };
      const fbp = cookie("_fbp");
      const fbc = cookie("_fbc");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          name: name.trim() || undefined,
          phone: trimmedPhone,
          // Captured for Meta CAPI (must be browser UA + page URL).
          clientUserAgent: navigator.userAgent,
          clientEventSourceUrl: window.location.href,
          ...(fbp ? { clientFbp: fbp } : {}),
          ...(fbc ? { clientFbc: fbc } : {}),
        }),
      });
      const raw = await res.text();
      let data: {
        error?: string;
        mode?: string;
        quizUrl?: string;
        checkoutUrl?: string;
        submissionId?: string;
        eventId?: string;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        throw new Error(
          raw?.slice(0, 180) || `Something went wrong (${res.status})`,
        );
      }
      if (!res.ok) throw new Error(data.error || "Could not start diagnostic");

      // Free path (default): Lead fires once contact is saved + CRM sync attempted.
      if (
        (data.mode === "free_lead" || data.mode === "dev_bypass") &&
        data.quizUrl
      ) {
        const submissionId = data.submissionId ?? "";
        const eventId =
          data.eventId ||
          (submissionId ? `lead_${submissionId}` : undefined);
        track("lead", {
          submission_id: submissionId,
          event_id: eventId,
          value: 0,
          currency: "USD",
          mode: data.mode,
        });
        router.push(data.quizUrl.replace(/^https?:\/\/[^/]+/, ""));
        return;
      }

      // Dormant Stripe path only when ENABLE_STRIPE_CHECKOUT=true.
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error("No diagnostic URL returned");
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
          ? "relative w-full overflow-hidden rounded-xl bg-white p-5 shadow-[0_0_60px_rgba(255,255,255,0.18)] sm:rounded-2xl sm:p-8"
          : "relative w-full overflow-hidden rounded-[1rem] border border-white/12 bg-white/[0.04] p-5 backdrop-blur-md sm:p-7"
      }
    >
      {!card && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--cn-red)]/70 to-transparent"
        />
      )}

      <div className="mb-6">
        <h2
          className={`cn-display text-[1.15rem] leading-[1.15] tracking-[0.06em] sm:text-xl sm:tracking-[0.08em] ${
            card ? "text-[var(--cn-ink)]" : "text-white"
          }`}
        >
          Start your
          <br />
          marketing diagnostic
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm font-medium leading-snug text-[#15803d] sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
          {(
            [
              "Free assessment",
              "Personalised report",
              "Consultation",
            ] as const
          ).map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <span aria-hidden className="text-base leading-none">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p
          className={`mt-2.5 text-sm leading-snug ${
            card ? "text-[var(--cn-muted)]" : "text-white/55"
          }`}
        >
          Answer based on your current setup. No preparation needed.
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
          You can start again anytime — the diagnostic is free.
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
            Work email{" "}
            <span className="normal-case tracking-normal">(required)</span>
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
            Phone{" "}
            <span className="normal-case tracking-normal">(required)</span>
          </span>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+971 50 000 0000"
            className={card ? "cn-input-light" : "cn-input"}
            autoComplete="tel"
            required
            aria-required="true"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="cn-btn mt-6 w-full whitespace-normal px-3 text-[0.8rem] leading-snug tracking-[0.04em] sm:px-6 sm:text-base"
      >
        {loading ? "Starting…" : "Get My Free Marketing Audit"}
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
        className={`mt-4 text-center text-[11px] leading-relaxed sm:text-xs ${
          card ? "text-[var(--cn-muted)]" : "text-white/40"
        }`}
      >
        Free · 25 questions · Report by email · Built for UAE businesses
      </p>
    </form>
  );
}

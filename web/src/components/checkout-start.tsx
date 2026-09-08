"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutStart({ cancelled }: { cancelled?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
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

  return (
    <form
      onSubmit={startCheckout}
      className="relative w-full overflow-hidden rounded-[1rem] border border-white/12 bg-white/[0.04] p-6 backdrop-blur-md sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--cn-red)]/70 to-transparent"
      />

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="cn-display text-[11px] tracking-[0.24em] text-[var(--cn-red)]">
            Start here
          </p>
          <p className="mt-2 text-sm text-white/55">Unlock the full diagnostic</p>
        </div>
        <p className="cn-display text-3xl leading-none text-white">
          $9
        </p>
      </div>

      {cancelled && (
        <p className="mb-4 rounded-[var(--radius-btn)] border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80">
          Checkout cancelled — you can try again anytime.
        </p>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-white/45">
            Name
          </span>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="cn-input"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-white/45">
            Work email
          </span>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="cn-input"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-white/45">
            Phone
          </span>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+971 50 000 0000"
            className="cn-input"
            autoComplete="tel"
          />
        </label>
      </div>

      <button type="submit" disabled={loading} className="cn-btn mt-5 w-full text-base">
        {loading ? "Opening checkout…" : "Start my diagnostic"}
        {!loading && (
          <span aria-hidden className="text-lg leading-none">
            ↗
          </span>
        )}
      </button>

      {error && <p className="mt-3 text-sm text-red-200">{error}</p>}

      <p className="mt-4 text-xs leading-relaxed text-white/40">
        Secure Stripe checkout · Report in minutes · Built for UAE businesses
      </p>
    </form>
  );
}

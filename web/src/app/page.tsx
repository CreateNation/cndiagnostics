import Link from "next/link";
import { BrandLogo, SiteFooter } from "@/components/site-chrome";
import { CheckoutStart } from "@/components/checkout-start";
import { WistiaEmbed } from "@/components/wistia-player";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-full bg-black text-white">
      {/* Top announcement bar — matches CNM GHL landing */}
      <div className="bg-[var(--cn-red)] px-4 py-2.5 text-center">
        <p className="cn-display text-[11px] tracking-[0.18em] text-white sm:text-xs">
          FOR BUSINESS OWNERS READY TO GROW
        </p>
      </div>

      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(228,67,54,0.22),transparent_55%)]"
        />

        <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-20 pt-10 text-center sm:pt-14">
          <Link
            href="/"
            className="mb-10 opacity-95 transition hover:opacity-100 sm:mb-12"
          >
            <BrandLogo tone="dark" size="lg" />
          </Link>

          <h1 className="cn-display animate-fade-up text-[1.85rem] leading-[1.08] tracking-[0.02em] text-white sm:text-4xl md:text-5xl lg:text-[3.15rem]">
            IS YOUR MARKETING LIMITING YOUR BUSINESS?
          </h1>

          <p className="animate-fade-up-delay mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Find out where your marketing budget is being wasted, and where you
            could be losing customers to competitors.
          </p>

          <div className="animate-fade-up-late relative mt-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#141414] shadow-[0_0_50px_rgba(228,67,54,0.12)]">
            <WistiaEmbed />
          </div>

          <p className="mt-10 max-w-2xl text-base leading-relaxed text-white/68 sm:text-lg">
            Answer 25 simple questions to receive an AI-powered marketing audit
            and a tailored growth roadmap by email. Then discuss your findings
            directly with{" "}
            <span className="text-white">Luay Fawaz</span>, Marketing strategist
            and founder of CNM.
          </p>

          <div className="mt-12 w-full max-w-md text-left">
            <CheckoutStart
              cancelled={params.cancelled === "1"}
              variant="card"
            />
          </div>
        </section>
      </main>

      <SiteFooter tone="dark" />
    </div>
  );
}

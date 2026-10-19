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
    <div className="flex min-h-full flex-col overflow-x-hidden bg-black text-white">
      {/* Top announcement bar — matches CNM GHL landing */}
      <div className="bg-[var(--cn-red)] px-3 py-2 text-center sm:px-4 sm:py-2.5">
        <p className="cn-display text-[10px] leading-snug tracking-[0.14em] text-white sm:text-[11px] sm:tracking-[0.18em] sm:text-xs">
          FOR BUSINESS OWNERS READY TO GROW
        </p>
      </div>

      <main className="relative flex-1 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(228,67,54,0.22),transparent_55%)]"
        />

        <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-14 pt-8 text-center sm:px-6 sm:pb-20 sm:pt-14">
          <Link
            href="/"
            className="mb-8 shrink-0 opacity-95 transition hover:opacity-100 sm:mb-12"
          >
            <BrandLogo tone="dark" size="lg" />
          </Link>

          <h1 className="cn-display animate-fade-up text-[1.55rem] leading-[1.1] tracking-[0.02em] text-white sm:text-4xl md:text-5xl lg:text-[3.15rem]">
            IS YOUR MARKETING LIMITING YOUR BUSINESS?
          </h1>

          <p className="animate-fade-up-delay mt-5 max-w-2xl text-pretty text-[0.95rem] leading-relaxed text-white/70 sm:mt-6 sm:text-lg">
            Find out where your marketing budget is being wasted, and where you
            could be losing customers to competitors.
          </p>

          <div className="animate-fade-up-late relative mt-8 w-full max-w-2xl overflow-hidden rounded-xl border border-white/15 bg-[#141414] shadow-[0_0_50px_rgba(228,67,54,0.12)] sm:mt-10 sm:rounded-2xl">
            <WistiaEmbed />
          </div>

          <p className="mt-8 max-w-2xl text-pretty text-[0.95rem] leading-relaxed text-white/68 sm:mt-10 sm:text-lg">
            Receive your AI-powered marketing audit and a tailored growth
            roadmap by email after answering these 25 simple questions.
            <br className="hidden sm:block" />
            <span className="mt-3 block sm:mt-4">
              Then discuss your findings directly with{" "}
              <span className="text-white">Luay Fawaz</span>, Marketing
              strategist and founder of CNM.
            </span>
          </p>

          <div className="mt-10 w-full max-w-md text-left sm:mt-12">
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

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CheckoutStart } from "@/components/checkout-start";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[var(--cn-charcoal)] text-white">
        <div aria-hidden className="cn-surface-dark pointer-events-none absolute inset-0" />
        <div aria-hidden className="cn-grain pointer-events-none absolute inset-0" />

        <SiteHeader />

        <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16 pt-32 lg:flex-row lg:items-end lg:justify-between lg:gap-20 lg:pb-24">
          <div className="max-w-2xl">
            <div
              aria-hidden
              className="h-[3px] w-24 bg-[var(--cn-red)] animate-draw-line"
            />
            <h1 className="cn-display animate-fade-up mt-8 max-w-xl text-[1.65rem] leading-[1.12] text-white sm:text-3xl md:text-4xl lg:text-[2.75rem]">
              What&apos;s really stopping your business from hitting its next
              revenue level?
            </h1>
            <p className="animate-fade-up-delay mt-5 max-w-md text-base leading-relaxed text-white/62 sm:text-lg">
              A 5-minute diagnostic that finds the leak in your marketing-to-sales
              funnel — personalized report for $9.
            </p>
          </div>

          <div className="mt-12 w-full max-w-md animate-fade-up-late lg:mt-0">
            <CheckoutStart cancelled={params.cancelled === "1"} />
          </div>
        </section>
      </main>

      <section className="relative overflow-hidden bg-[var(--cn-paper)] px-6 py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-[var(--cn-red)]/8 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="cn-display text-xs tracking-[0.28em] text-[var(--cn-red)]">
            What you get
          </p>
          <h2 className="cn-display mt-4 max-w-2xl text-3xl leading-[1.08] text-[var(--cn-ink)] md:text-5xl">
            Clarity on the bottleneck.
            <span className="mt-2 block text-[var(--cn-muted)]">
              Not another generic checklist.
            </span>
          </h2>

          <ul className="mt-16 grid border-t border-[var(--cn-line)] sm:grid-cols-2 lg:grid-cols-4 lg:border-t-0">
            {[
              {
                n: "01",
                t: "Your growth stage",
                d: "From Validation to Expansion — named, evidenced, and clear.",
              },
              {
                n: "02",
                t: "Five-dimension scorecard",
                d: "Audience, offer, funnel, content, and systems — scored.",
              },
              {
                n: "03",
                t: "Primary bottleneck",
                d: "The one constraint holding revenue back right now.",
              },
              {
                n: "04",
                t: "Directional 90-day path",
                d: "What to do next — without a locked implementation plan.",
              },
            ].map((item) => (
              <li
                key={item.n}
                className="border-b border-[var(--cn-line)] py-8 pr-6 last:border-b-0 sm:odd:border-r sm:odd:pr-8 sm:even:pl-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
              >
                <p className="cn-display text-sm tracking-[0.2em] text-[var(--cn-red)]">
                  {item.n}
                  <span className="text-[var(--cn-red)]"> +</span>
                </p>
                <h3 className="cn-display mt-5 text-xl text-[var(--cn-ink)]">
                  {item.t}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--cn-muted)]">
                  {item.d}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

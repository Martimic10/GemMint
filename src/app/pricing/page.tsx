import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FaqSection } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { PricingComparison } from "@/components/sections/pricing-comparison";
import { PricingSection } from "@/components/sections/pricing";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { PRICING_FAQ_ITEMS, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Buy a one-time Professional Report for $7.99, or Starter, Collector, and Dealer credit packs. No subscriptions. Credits never expire.",
  openGraph: {
    title: `Pricing · ${SITE.name}`,
    description:
      "One-time AI grading reports and credit packs. No subscriptions — credits never expire.",
  },
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="pt-28 pb-8 sm:pt-40 lg:pt-44 lg:pb-12">
          <Container>
            <FadeIn>
              <div className="mx-auto max-w-2xl text-center">
                <p className="mb-3 text-sm font-semibold tracking-wide text-emerald uppercase">
                  Pricing
                </p>
                <h1 className="text-[2rem] font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                  Reports for every collection.
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
                  No subscriptions. Buy a single Professional Report or a credit
                  pack — grade when you&apos;re ready, and keep unused credits
                  forever.
                </p>
              </div>
            </FadeIn>
          </Container>
        </section>

        <PricingSection
          showHeader={false}
          className="border-y-0 bg-transparent pt-4 pb-20 lg:pb-28"
        />

        <PricingComparison />

        <FaqSection
          id="pricing-faq"
          eyebrow="Pricing FAQ"
          title="Questions about credits & billing."
          description="Transparent answers before you buy a pack."
          items={PRICING_FAQ_ITEMS}
        />

        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

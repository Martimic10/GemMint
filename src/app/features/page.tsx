import type { Metadata } from "next";
import Link from "next/link";
import { AuthCtaLink } from "@/components/auth/auth-cta-link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FaqSection } from "@/components/sections/faq";
import { FeaturesSection } from "@/components/sections/features";
import {
  FeaturesCapabilities,
  FeaturesHighlights,
} from "@/components/sections/features-page";
import { FinalCta } from "@/components/sections/final-cta";
import { ReportPreview } from "@/components/sections/report-preview";
import { TrustSection } from "@/components/sections/trust";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { FEATURES_FAQ_ITEMS, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore GemMint features — dual PSA and Beckett predictions, category analysis, heatmaps, reports, and submission guidance.",
  openGraph: {
    title: `Features · ${SITE.name}`,
    description:
      "Professional AI trading card grading features built for collectors, dealers, and investors.",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="pt-36 pb-12 sm:pt-40 lg:pt-44 lg:pb-14">
          <Container>
            <FadeIn>
              <div className="mx-auto max-w-3xl text-center">
                <p className="mb-3 text-sm font-semibold tracking-wide text-emerald uppercase">
                  Features
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
                  Professional grading intelligence, built for decisions.
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">
                  Computer vision that inspects every category, predicts PSA and
                  Beckett grades, and shows you exactly what matters before you
                  submit.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button size="lg" asChild>
                    <AuthCtaLink>Grade My Card</AuthCtaLink>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </FadeIn>
          </Container>
        </section>

        <FeaturesHighlights />
        <TrustSection />
        <FeaturesSection />
        <FeaturesCapabilities />
        <ReportPreview />
        <FaqSection
          id="features-faq"
          eyebrow="Features FAQ"
          title="How GemMint analysis works."
          description="Answers about categories, reports, and what you get with every scan."
          items={FEATURES_FAQ_ITEMS}
        />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

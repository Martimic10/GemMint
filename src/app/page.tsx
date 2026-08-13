import { FaqSection } from "@/components/sections/faq";
import { FeaturesSection } from "@/components/sections/features";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { PricingSection } from "@/components/sections/pricing";
import { TrustSection } from "@/components/sections/trust";
import { WhyGemMint } from "@/components/sections/why-gemmint";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustSection />
        <HowItWorks />
        <FeaturesSection />
        <WhyGemMint />
        <PricingSection variant="teaser" />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

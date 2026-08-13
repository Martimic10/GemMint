import Link from "next/link";
import { Play } from "lucide-react";
import { AuthCtaLink } from "@/components/auth/auth-cta-link";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-12 sm:pt-40 sm:pb-20 lg:pt-48 lg:pb-28">
      <Container className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-12 xl:gap-16">
        <div className="max-w-xl">
          <FadeIn>
            <p className="mb-5 text-sm font-semibold tracking-wide text-emerald uppercase">
              GemMint
            </p>
            <h1 className="text-[2rem] font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              Professional AI Trading Card Grading.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:mt-5 sm:text-xl">
              Predict your PSA and Beckett grades in under 30 seconds using
              advanced computer vision.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <AuthCtaLink>Grade My Card</AuthCtaLink>
              </Button>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
                <Link href="/demo">
                  <Play className="h-4 w-4 fill-current" />
                  View Demo
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted">
              Trusted precision for collectors, dealers, and investors.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.15} className="min-w-0">
          <DashboardPreview />
        </FadeIn>
      </Container>
    </section>
  );
}

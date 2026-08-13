import { Check } from "lucide-react";
import { TradingCardViz } from "@/components/marketing/trading-card-viz";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeader } from "@/components/ui/section-header";
import { FEATURE_CARD_ORDER } from "@/lib/cards";
import { FEATURE_DETAILS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 lg:py-28"
      aria-labelledby="features-heading"
    >
      <Container>
        <FadeIn>
          <SectionHeader
            id="features-heading"
            eyebrow="Technology"
            title="Inspect every grading category"
            description="Each analysis layer isolates a different part of the card — corners, edges, centering, and surface — with lab-grade precision."
            className="mb-16 max-w-2xl lg:mb-24"
          />
        </FadeIn>

        <div className="flex flex-col gap-20 lg:gap-28">
          {FEATURE_DETAILS.map((feature, index) => {
            const reversed = index % 2 === 1;

            return (
              <FadeIn key={feature.id} delay={0.05}>
                <div
                  className={cn(
                    "grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20",
                    reversed && "lg:[&>*:first-child]:order-2"
                  )}
                >
                  <div className={cn(reversed ? "lg:pl-4" : "lg:pr-4")}>
                    <p className="mb-3 text-sm font-semibold tracking-wide text-emerald uppercase">
                      0{index + 1}
                    </p>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                      {feature.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {feature.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-3 text-sm text-foreground sm:text-base"
                        >
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald text-white">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-center rounded-[1.5rem] border border-border bg-card px-6 py-10 sm:px-10 sm:py-12">
                    <TradingCardViz
                      active={feature.id}
                      card={FEATURE_CARD_ORDER[index] ?? "griffey"}
                    />
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

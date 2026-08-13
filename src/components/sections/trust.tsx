import {
  Aperture,
  Fingerprint,
  Focus,
  Maximize2,
  Scan,
  Square,
} from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeader } from "@/components/ui/section-header";
import { TRUST_CATEGORIES } from "@/lib/constants";

const ICONS = {
  centering: Focus,
  corners: Maximize2,
  edges: Square,
  surface: Scan,
  print: Aperture,
  authenticity: Fingerprint,
} as const;

export function TrustSection() {
  return (
    <section className="py-20 lg:py-28" aria-labelledby="trust-heading">
      <Container>
        <FadeIn>
          <SectionHeader
            id="trust-heading"
            eyebrow="Analysis"
            title="Trusted Card Analysis"
            description="Every grading category evaluated independently with computer vision built for professional standards."
          />
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {TRUST_CATEGORIES.map((category, index) => {
            const Icon = ICONS[category.icon];
            return (
              <AnimatedCard key={category.title} delay={index * 0.05}>
                <div className="mb-4 flex items-start justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-emerald">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  {"comingSoon" in category && category.comingSoon ? (
                    <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">
                      Coming Soon
                    </span>
                  ) : null}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {category.description}
                </p>
              </AnimatedCard>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

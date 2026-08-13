import {
  BadgeCheck,
  Focus,
  Gauge,
  Layers2,
  ScanSearch,
  Wallet,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeader } from "@/components/ui/section-header";
import { FEATURES_CAPABILITIES, FEATURES_HIGHLIGHTS } from "@/lib/constants";

const CAPABILITY_ICONS = {
  standards: Layers2,
  confidence: Gauge,
  heatmap: ScanSearch,
  guidance: BadgeCheck,
  value: Wallet,
  centering: Focus,
} as const;

export function FeaturesHighlights() {
  return (
    <section className="pb-16 lg:pb-20" aria-label="Feature highlights">
      <Container>
        <FadeIn>
          <div className="grid grid-cols-2 gap-3 rounded-[1.5rem] border border-border bg-card p-3 sm:gap-4 sm:p-4 lg:grid-cols-4">
            {FEATURES_HIGHLIGHTS.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-surface px-4 py-5 text-center sm:px-5 sm:py-6"
              >
                <p className="text-2xl font-bold tracking-tight text-emerald sm:text-3xl">
                  {item.value}
                </p>
                <p className="mt-1.5 text-xs text-muted sm:text-sm">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}

export function FeaturesCapabilities() {
  return (
    <section
      className="border-y border-border bg-card py-20 lg:py-28"
      aria-labelledby="capabilities-heading"
    >
      <Container>
        <FadeIn>
          <SectionHeader
            id="capabilities-heading"
            eyebrow="Platform"
            title="Everything you need before you submit"
            description="From dual-standard predictions to market estimates — GemMint turns a photo into a decision-ready grading brief."
          />
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {FEATURES_CAPABILITIES.map((item, index) => {
            const Icon = CAPABILITY_ICONS[item.icon];
            return (
              <FadeIn key={item.title} delay={index * 0.05}>
                <div className="flex h-full flex-col rounded-[1.35rem] border border-border bg-surface p-6 sm:p-7">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

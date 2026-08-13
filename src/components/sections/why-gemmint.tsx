import { Check, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeader } from "@/components/ui/section-header";
import { WHY_COMPARISON } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function WhyGemMint() {
  return (
    <section
      className="py-16 sm:py-20 lg:py-28"
      aria-labelledby="why-heading"
    >
      <Container>
        <FadeIn>
          <SectionHeader
            id="why-heading"
            eyebrow="Why GemMint"
            title="Guesswork vs. GemMint"
            description="See how pre-submission AI analysis compares to submitting cards blind."
          />
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10 sm:mt-12">
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="min-w-[560px] overflow-hidden rounded-[1.25rem] border border-border bg-surface shadow-[0_8px_30px_rgba(17,24,39,0.04)] sm:min-w-0 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              {/* Header */}
              <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border bg-card sm:grid-cols-[1.4fr_1fr_1fr]">
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase sm:text-sm">
                    Compare
                  </p>
                </div>
                <div className="border-l border-border px-3 py-4 sm:px-6 sm:py-5">
                  <p className="text-xs font-semibold text-muted sm:text-sm">
                    Traditional
                  </p>
                  <p className="mt-0.5 hidden text-xs text-muted sm:block">
                    Submit & hope
                  </p>
                </div>
                <div className="relative border-l border-border bg-emerald/[0.04] px-3 py-4 sm:px-6 sm:py-5">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald" />
                  <p className="text-xs font-semibold text-emerald sm:text-sm">
                    GemMint
                  </p>
                  <p className="mt-0.5 hidden text-xs text-muted sm:block">
                    Know first
                  </p>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border">
                {WHY_COMPARISON.map((row, index) => (
                  <div
                    key={row.category}
                    className={cn(
                      "grid grid-cols-[1.2fr_1fr_1fr] sm:grid-cols-[1.4fr_1fr_1fr]",
                      index % 2 === 1 && "bg-card/50"
                    )}
                  >
                    <div className="flex items-center px-4 py-4 sm:px-6 sm:py-5">
                      <p className="text-xs font-semibold text-foreground sm:text-sm">
                        {row.category}
                      </p>
                    </div>

                    <div className="flex items-start gap-2 border-l border-border px-3 py-4 sm:items-center sm:px-6 sm:py-5">
                      <span className="mt-0.5 hidden h-5 w-5 shrink-0 items-center justify-center rounded-full bg-border/80 text-muted sm:inline-flex">
                        <Minus className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <p className="text-xs leading-relaxed text-muted sm:text-sm">
                        {row.traditional}
                      </p>
                    </div>

                    <div className="flex items-start gap-2 border-l border-border bg-emerald/[0.04] px-3 py-4 sm:items-center sm:px-6 sm:py-5">
                      <span className="mt-0.5 hidden h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald text-white sm:inline-flex">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <p className="text-xs font-medium leading-relaxed text-foreground sm:text-sm">
                        {row.gemmint}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted sm:hidden">
            Swipe to see full comparison →
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p className="mt-6 text-center text-sm text-muted">
            GemMint doesn&apos;t replace PSA or Beckett — it helps you decide
            what&apos;s worth grading.
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}

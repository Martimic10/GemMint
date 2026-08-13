import { Check, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeader } from "@/components/ui/section-header";
import { PRICING_COMPARISON, PRICING_PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return (
      <span className="text-xs font-medium text-foreground sm:text-sm">
        {value}
      </span>
    );
  }

  if (value) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-border/80 text-muted">
      <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

export function PricingComparison() {
  const plans = PRICING_PLANS;

  return (
    <section
      className="py-20 lg:py-28"
      aria-labelledby="pricing-compare-heading"
    >
      <Container>
        <FadeIn>
          <SectionHeader
            id="pricing-compare-heading"
            eyebrow="Compare"
            title="Every pack, side by side"
            description="Same professional report quality — choose the credit volume that fits."
          />
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12">
          <div className="overflow-x-auto rounded-[1.25rem] border border-border bg-surface shadow-[0_8px_30px_rgba(17,24,39,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-4 text-xs font-semibold tracking-wide text-muted uppercase sm:px-6 sm:py-5 sm:text-sm">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className={cn(
                        "px-3 py-4 text-center sm:px-6 sm:py-5",
                        plan.highlighted && "bg-emerald/[0.04]"
                      )}
                    >
                      <span
                        className={cn(
                          "block text-xs font-semibold sm:text-sm",
                          plan.highlighted ? "text-emerald" : "text-foreground"
                        )}
                      >
                        {plan.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        ${plan.price.toFixed(2)}
                        {"credits" in plan ? (
                          <span className="block">
                            {plan.credits} credits
                          </span>
                        ) : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PRICING_COMPARISON.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={cn(index % 2 === 1 && "bg-card/50")}
                  >
                    <td className="px-4 py-4 text-xs font-semibold text-foreground sm:px-6 sm:py-4 sm:text-sm">
                      {row.feature}
                    </td>
                    {(
                      [
                        ["starter", row.starter],
                        ["collector", row.collector],
                        ["dealer", row.dealer],
                      ] as const
                    ).map(([planId, value]) => {
                      const highlighted = planId === "collector";
                      return (
                        <td
                          key={planId}
                          className={cn(
                            "px-3 py-4 text-center sm:px-6",
                            highlighted && "bg-emerald/[0.04]"
                          )}
                        >
                          <div className="flex justify-center">
                            <CellValue value={value} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}

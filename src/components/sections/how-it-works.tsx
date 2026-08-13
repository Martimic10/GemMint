import Image from "next/image";
import { Check, ImagePlus, Loader2, ScanLine } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { CARD_ASSETS, type CardAssetId } from "@/lib/cards";
import { HOW_IT_WORKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function MiniCard({
  className,
  card = "griffey",
}: {
  className?: string;
  card?: CardAssetId;
}) {
  const asset = CARD_ASSETS[card];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[5px] bg-white shadow-lg",
        className
      )}
      style={{ aspectRatio: asset.aspect.replace("/", " / ") }}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes="140px"
        className="object-cover object-center"
      />
    </div>
  );
}

function StepVisual({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[#0f172a] px-4 py-6 sm:px-5 sm:py-8">
        <div className="relative w-[42%] sm:w-[52%]">
          <MiniCard card="griffey" />
          <div className="pointer-events-none absolute inset-0 rounded-[5px] border border-dashed border-emerald/70" />
          <span className="pointer-events-none absolute left-0 top-0 h-3.5 w-3.5 border-l-2 border-t-2 border-emerald" />
          <span className="pointer-events-none absolute right-0 top-0 h-3.5 w-3.5 border-r-2 border-t-2 border-emerald" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b-2 border-l-2 border-emerald" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b-2 border-r-2 border-emerald" />
        </div>

        <div className="relative mt-4 w-full max-w-[200px] rounded-2xl border border-white/15 bg-[#111827]/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:mt-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald/20 text-emerald">
              <ImagePlus className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white">
                Card detected
              </p>
              <p className="truncate text-[10px] text-white/60">
                Front · Back ready
              </p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[72%] rounded-full bg-emerald" />
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-white/55">
            Uploading images…
          </p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[#111827] px-4 py-6 sm:px-5 sm:py-8">
        <div className="relative mb-4 w-[40%] sm:mb-5 sm:w-[48%]">
          <MiniCard card="griffey" />
          <div className="pointer-events-none absolute inset-0 rounded-[5px] border border-royal/40 bg-royal/10" />
          <span className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full border border-emerald bg-emerald/30" />
          <span className="absolute right-2 top-8 h-2.5 w-2.5 rounded-full border border-royal bg-royal/30" />
          <span className="absolute bottom-6 left-3 h-2.5 w-2.5 rounded-full border border-emerald bg-emerald/30" />
        </div>

        <div className="relative w-full max-w-[210px] rounded-2xl border border-white/15 bg-[#111827]/95 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ScanLine className="h-3.5 w-3.5 text-royal" />
              <span className="text-[11px] font-semibold text-white">
                Analyzing
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald">
              <Loader2 className="h-3 w-3 animate-spin" />
              Live
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Centering", value: "9.5", width: "94%" },
              { label: "Corners", value: "9.0", width: "90%" },
              { label: "Edges", value: "9.5", width: "95%" },
              { label: "Surface", value: "9.0", width: "88%" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="w-14 text-[10px] text-white/55">{row.label}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-royal"
                    style={{ width: row.width }}
                  />
                </div>
                <span className="w-5 text-right text-[10px] font-bold text-white">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[#0b1220] px-4 py-6 sm:px-5 sm:py-8">
      <div className="relative w-full max-w-[220px] rounded-2xl border border-white/15 bg-[#111827]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-emerald/20 px-2 py-0.5 text-[10px] font-semibold text-emerald">
            Report ready
          </span>
          <span className="text-[10px] text-white/50">18s</span>
        </div>
        <p className="text-[11px] text-white/55">Predicted PSA Grade</p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight text-white">
          9.5
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/5 px-2.5 py-2 ring-1 ring-white/10">
            <p className="text-[9px] text-white/50">Beckett</p>
            <p className="text-sm font-bold text-white">9.0</p>
          </div>
          <div className="rounded-xl bg-white/5 px-2.5 py-2 ring-1 ring-white/10">
            <p className="text-[9px] text-white/50">Confidence</p>
            <p className="text-sm font-bold text-white">94%</p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
          {["Strong centering", "Clean surface", "Submit to PSA"].map(
            (item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-[11px] text-white/90"
              >
                <Check className="h-3 w-3 text-emerald" strokeWidth={2.5} />
                {item}
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="technology"
      className="py-16 sm:py-20 lg:py-28"
      aria-labelledby="how-heading"
    >
      <Container>
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold tracking-wide text-royal uppercase">
              How it works
            </p>
            <h2
              id="how-heading"
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
            >
              From photo to grade,
              <br className="hidden sm:block" /> in three steps
            </h2>
          </div>
        </FadeIn>

        <div className="mt-10 sm:mt-14 lg:mt-16">
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-3 lg:gap-8">
            {HOW_IT_WORKS.map((step, index) => (
              <FadeIn
                key={step.step}
                delay={index * 0.08}
                className="min-w-0"
              >
                <article className="flex h-full flex-col">
                  <div className="aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-border shadow-[0_8px_30px_rgba(17,24,39,0.06)] sm:aspect-[5/4] lg:aspect-[4/5]">
                    <StepVisual step={step.step} />
                  </div>
                  <div className="mt-4 px-0.5 sm:mt-5">
                    <p className="text-[11px] font-semibold tracking-wide text-royal uppercase">
                      Step {step.step}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

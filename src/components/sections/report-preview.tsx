import { ReportMockup } from "@/components/marketing/dashboard-preview";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeader } from "@/components/ui/section-header";

export function ReportPreview() {
  return (
    <section
      id="report"
      className="scroll-mt-28 border-y border-border bg-card py-20 lg:py-28"
      aria-labelledby="report-heading"
    >
      <Container>
        <FadeIn>
          <SectionHeader
            id="report-heading"
            eyebrow="Report"
            title="A grading report built for decisions"
            description="Printable, shareable, and precise — designed to look like it came from a professional lab."
          />
        </FadeIn>

        <FadeIn delay={0.12} className="mt-10 sm:mt-12">
          <ReportMockup
            className="mx-auto max-w-5xl"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </FadeIn>
      </Container>
    </section>
  );
}

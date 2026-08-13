"use client";

import type { RichGradeReport } from "@/lib/grade-flow-data";
import { RecommendationCard } from "@/components/grade-flow/recommendation-card";

interface ValuePanelProps {
  report: RichGradeReport;
}

export function ValuePanel({ report }: ValuePanelProps) {
  const { grade, submissionCost, potentialProfit } = report;
  const { market } = grade;
  const predictedKey =
    grade.psa >= 10 ? "PSA 10" : grade.psa === 9 ? "PSA 9" : grade.psa === 8 ? "PSA 8" : `PSA ${grade.psa}`;

  const rows = [
    { label: "Raw Value", value: market.raw },
    { label: "PSA 8 Comp", value: market.psa8 },
    { label: "PSA 9 Comp", value: market.psa9 },
    { label: "PSA 10 Comp", value: market.psa10 },
    {
      label: `Est. Value at ${predictedKey}`,
      value: grade.estimatedValue,
      highlight: true,
    },
    { label: "Estimated Submission Cost", value: submissionCost },
    {
      label: "Expected ROI (after fees)",
      value: potentialProfit,
      highlight: true,
      signed: true,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3.5 font-medium text-muted">
                  {row.label}
                </td>
                <td
                  className={`px-4 py-3.5 text-right text-base font-bold tabular-nums ${
                    row.highlight
                      ? potentialProfit < 0 && row.signed
                        ? "text-red-600"
                        : "text-emerald"
                      : "text-foreground"
                  }`}
                >
                  {row.signed
                    ? `${row.value >= 0 ? "+" : "-"}$${Math.abs(row.value).toLocaleString()}`
                    : `$${row.value.toLocaleString()}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RecommendationCard
        recommendation={grade.recommendation}
        reasoning={`At a predicted PSA ${grade.psa} (~$${grade.estimatedValue.toLocaleString()}), ROI after ~$${submissionCost} fees vs ~$${market.raw.toLocaleString()} raw is ${potentialProfit >= 0 ? "+" : "-"}$${Math.abs(potentialProfit).toLocaleString()}. ${grade.insight}`}
      />

      {report.marketSource === "pricecharting" ? (
        <p className="text-center text-[11px] text-muted">
          Market comps from PriceCharting / SportsCardsPro
          {report.marketProductName ? (
            <>
              {" "}
              · matched{" "}
              {report.marketUrl ? (
                <a
                  href={report.marketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {report.marketProductName}
                </a>
              ) : (
                <span className="font-medium text-foreground">
                  {report.marketProductName}
                </span>
              )}
            </>
          ) : null}
        </p>
      ) : report.marketSource === "web" ? (
        <p className="text-center text-[11px] text-muted">
          Market comps from live web search (eBay sold / PriceCharting /
          auction houses)
          {report.marketProductName ? (
            <>
              {" "}
              · {report.marketProductName}
            </>
          ) : null}
          . Add PRICECHARTING_API_TOKEN for catalog-matched prices.
        </p>
      ) : (
        <p className="text-center text-[11px] text-amber-700">
          Could not pull live comps — showing calibrated estimate. Add
          PRICECHARTING_API_TOKEN for the most accurate prices.
        </p>
      )}
    </div>
  );
}

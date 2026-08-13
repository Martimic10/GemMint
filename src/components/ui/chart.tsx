"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-auto justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/15 [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, item]) => item.color
  );
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, item]) => `  --color-${key}: ${item.color};`)
          .join("\n")}\n}`,
      }}
    />
  );
}

export function ChartTooltip(
  props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>
) {
  return <RechartsPrimitive.Tooltip {...props} />;
}

type TooltipItem = {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  payload?: unknown;
};

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  label,
  labelFormatter,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  className?: string;
  hideLabel?: boolean;
  indicator?: "line" | "dot" | "dashed";
  label?: React.ReactNode;
  labelFormatter?: (
    label: React.ReactNode,
    payload: TooltipItem[]
  ) => React.ReactNode;
  formatter?: (
    value: number | string,
    name: string,
    item: TooltipItem,
    index: number,
    payload: TooltipItem[]
  ) => React.ReactNode;
  nameKey?: string;
  labelKey?: string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  const [item] = payload;
  const nestLabel = payload.length === 1 && indicator !== "dot";

  const tooltipLabel = hideLabel
    ? null
    : labelFormatter && label != null
      ? labelFormatter(label, payload)
      : label;

  return (
    <div
      className={cn(
        "grid min-w-[10rem] items-start gap-1.5 rounded-xl border border-border/60 bg-surface px-3 py-2 text-xs shadow-[0_8px_30px_rgba(17,24,39,0.12)]",
        className
      )}
    >
      {!nestLabel && tooltipLabel ? (
        <div className="font-medium text-foreground">{tooltipLabel}</div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((entry) => {
          const dataKey = String(entry.dataKey ?? entry.name ?? "value");
          const cfg = config[dataKey];
          const formatted =
            formatter && entry.value != null
              ? formatter(
                  entry.value,
                  entry.name ?? dataKey,
                  entry,
                  0,
                  payload
                )
              : undefined;

          return (
            <div key={dataKey} className="flex w-full items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ background: cfg?.color || entry.color || "#16A34A" }}
              />
              <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                <span className="text-muted">
                  {cfg?.label || entry.name || dataKey}
                </span>
                {formatted ? (
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatted}
                  </span>
                ) : entry.value != null ? (
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {typeof entry.value === "number"
                      ? entry.value.toLocaleString()
                      : String(entry.value)}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

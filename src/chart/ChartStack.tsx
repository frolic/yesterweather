import { useState } from "react";
import type { DaySeries, Metric, Unit } from "../weather/common.ts";
import { chartView, type ChartVariable } from "./chartVariable.ts";
import { OverlayChart } from "./OverlayChart.tsx";

const LANES: ChartVariable[] = ["temperature", "wind", "rain"];
/** Every lane gets the same plot height, so the three read on equal terms. */
const PLOT_HEIGHT = 150;

/**
 * Temperature, wind and rain as stacked charts on one shared −12h…+12h axis,
 * so all three read together without tabs. Hovering any chart moves one shared
 * cursor through all of them; the tooltip shows on the chart under the pointer.
 * Only the bottom chart draws the clock-hour axis.
 */
export function ChartStack(props: {
  series: DaySeries[];
  metric: Metric;
  unit: Unit;
  temperatureUnit: string;
  currentHour: number;
  hiddenOffsets: Set<number>;
}) {
  const { series, metric, unit, temperatureUnit, currentHour, hiddenOffsets } = props;
  const [hover, setHover] = useState<{
    rel: number;
    variable: ChartVariable;
  } | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {LANES.map((variable, index) => {
        const view = chartView({
          variable: variable,
          metric,
          unit,
          temperatureUnit,
        });
        const heading =
          variable === "temperature" ? "Temperature" : variable === "wind" ? "Wind" : "Rain";
        return (
          <section key={variable} className={`flex flex-col gap-1 ${index > 0 ? "pt-2.5" : ""}`}>
            <h2 className="pl-[54px] pr-1.5 text-center text-[13px] font-medium text-neutral-300">
              {heading}
            </h2>
            <OverlayChart
              series={series}
              value={view.value}
              format={view.format}
              unitSymbol={view.unitSymbol}
              axisSuffix={view.axisSuffix}
              clampZero={view.clampZero}
              currentHour={currentHour}
              hiddenOffsets={hiddenOffsets}
              plotHeight={PLOT_HEIGHT}
              timeAxis={index === LANES.length - 1}
              hoverRel={hover?.rel ?? null}
              onHover={(rel) => setHover(rel == null ? null : { rel, variable: variable })}
              showTooltip={hover?.variable === variable}
            />
          </section>
        );
      })}
    </div>
  );
}

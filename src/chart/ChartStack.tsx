import { useState } from "react";
import type { DaySeries, Metric, Unit } from "../weather/common.ts";
import { chartView, type ChartVariable } from "./chartVariable.ts";
import { OverlayChart } from "./OverlayChart.tsx";

const LANES: { variable: ChartVariable; height: number }[] = [
  { variable: "temperature", height: 190 },
  { variable: "wind", height: 80 },
  { variable: "rain", height: 94 },
];

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
  const { series, metric, unit, temperatureUnit, currentHour, hiddenOffsets } =
    props;
  const [hover, setHover] = useState<{
    rel: number;
    variable: ChartVariable;
  } | null>(null);
  const windUnit = unit === "fahrenheit" ? "mph" : "km/h";

  return (
    <div className="flex flex-col gap-2">
      {LANES.map((lane, index) => {
        const view = chartView({
          variable: lane.variable,
          metric,
          unit,
          temperatureUnit,
        });
        const title =
          lane.variable === "temperature"
            ? metric === "feels"
              ? `feels ${temperatureUnit}`
              : temperatureUnit
            : lane.variable === "wind"
              ? windUnit
              : "rain mm";
        return (
          <OverlayChart
            key={lane.variable}
            series={series}
            value={view.value}
            format={view.format}
            unitSymbol={view.unitSymbol}
            axisSuffix={view.axisSuffix}
            clampZero={view.clampZero}
            currentHour={currentHour}
            hiddenOffsets={hiddenOffsets}
            title={title}
            height={lane.height}
            timeAxis={index === LANES.length - 1}
            diffFill={lane.variable === "temperature"}
            hoverRel={hover?.rel ?? null}
            onHover={(rel) =>
              setHover(rel == null ? null : { rel, variable: lane.variable })
            }
            showTooltip={hover?.variable === lane.variable}
          />
        );
      })}
    </div>
  );
}

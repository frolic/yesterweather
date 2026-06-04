import type { CurrentConditions as Conditions, Metric } from "./common.ts";
import { weatherCodeLabel } from "./weatherCodeLabel.ts";

/** Big "right now" readout: the active metric leads, the other is shown small
 * so the wind-chill gap (feels 1° vs actual 6°) is visible at a glance. */
export function CurrentConditions(props: {
  conditions: Conditions;
  metric: Metric;
  unitSymbol: string;
  windUnit: string;
}) {
  const { conditions, metric, unitSymbol, windUnit } = props;
  const sky = weatherCodeLabel(conditions.weatherCode);

  const lead = metric === "feels" ? conditions.feels : conditions.actual;
  const secondaryLabel = metric === "feels" ? "actual" : "feels like";
  const secondary = metric === "feels" ? conditions.actual : conditions.feels;

  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-semibold tabular-nums tracking-tight">
            {Math.round(lead)}
            {unitSymbol}
          </span>
        </div>
        <div className="mt-1 text-sm text-slate-400">
          {metric === "feels" ? "Feels like now" : "Actual now"} ·{" "}
          {secondaryLabel} {Math.round(secondary)}
          {unitSymbol}
        </div>
      </div>
      <div className="text-right">
        <div className="text-3xl leading-none">{sky.icon}</div>
        <div className="mt-1 text-sm text-slate-300">{sky.text}</div>
        <div className="mt-1 text-xs text-slate-500">
          💧 {conditions.humidity}% · 💨 {Math.round(conditions.windSpeed)}{" "}
          {windUnit}
        </div>
      </div>
    </div>
  );
}

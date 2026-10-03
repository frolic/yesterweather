import type { CurrentConditions as Conditions, Metric } from "./common.ts";
import { weatherCodeLabel } from "./weatherCodeLabel.ts";

/** One-row "right now" readout: the active metric leads, the other metric,
 * sky, humidity and wind sit beside it so the wind-chill gap (feels 1° vs
 * actual 6°) is visible at a glance without a second block. The sky is shown
 * as an icon only; its text is the tooltip. */
export function CurrentConditions(props: {
  conditions: Conditions;
  metric: Metric;
  unitSymbol: string;
  windUnit: string;
}) {
  const { conditions, metric, unitSymbol, windUnit } = props;
  const sky = weatherCodeLabel(conditions.weatherCode);

  const lead = metric === "feels" ? conditions.feels : conditions.actual;
  const secondaryLabel = metric === "feels" ? "actual" : "feels";
  const secondary = metric === "feels" ? conditions.actual : conditions.feels;

  return (
    <div className="flex items-center gap-3">
      <span className="text-5xl font-semibold tabular-nums leading-none tracking-tight">
        {Math.round(lead)}
        {unitSymbol}
      </span>
      <div className="min-w-0 flex-1 text-xs leading-snug text-slate-400">
        <div>
          {secondaryLabel}{" "}
          <span className="tabular-nums text-slate-200">
            {Math.round(secondary)}
            {unitSymbol}
          </span>
        </div>
        <div className="whitespace-nowrap tabular-nums">
          💧 {conditions.humidity}% · 💨 {Math.round(conditions.windSpeed)}{" "}
          {windUnit}
        </div>
      </div>
      <span
        className="shrink-0 text-3xl leading-none"
        title={sky.text}
        aria-label={sky.text}
        role="img"
      >
        {sky.icon}
      </span>
    </div>
  );
}

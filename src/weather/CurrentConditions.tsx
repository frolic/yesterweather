import type { Forecast, Metric } from "./common.ts";
import { weatherCodeLabel } from "./weatherCodeLabel.ts";

const LOOKAHEAD_HOURS = 4;
const OUTLOOK_HOURS = 12;

const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value)}°`;
const tone = (value: number) =>
  value > 0 ? "text-amber-300" : value < 0 ? "text-sky-300" : "text-slate-200";

/**
 * "Right now" header: the active metric leads, the other metric, sky and
 * humidity sit beside it, and a strip of numbers below gives the comparisons
 * on the active metric — vs this hour yesterday, change in 4 hours, the next
 * 12 hours' high/low and rain, and wind now. Comparisons come from the flat
 * hourly timeline, so they cross midnight cleanly.
 */
export function CurrentConditions(props: {
  forecast: Forecast;
  metric: Metric;
  windUnit: string;
}) {
  const { forecast, metric, windUnit } = props;
  const { hourly, current, temperatureUnit } = forecast;
  const sky = weatherCodeLabel(current.weatherCode);

  const lead = metric === "feels" ? current.feels : current.actual;
  const secondaryLabel = metric === "feels" ? "actual" : "feels";
  const secondary = metric === "feels" ? current.actual : current.feels;

  const nowIndex = hourly.findIndex(
    (reading) =>
      reading.dateKey === current.dateKey && reading.hour === current.hour,
  );
  const now = hourly[nowIndex];
  const yesterday = hourly[nowIndex - 24];
  const later = hourly[nowIndex + LOOKAHEAD_HOURS];
  const outlook = nowIndex < 0 ? [] : hourly.slice(nowIndex, nowIndex + OUTLOOK_HOURS + 1);
  const outlookValues = outlook.map((reading) => reading[metric]);
  const rain = outlook.reduce((sum, reading) => sum + reading.precipitation, 0);

  const delta = (from?: typeof now, to?: typeof now) =>
    from && to ? Math.round(to[metric] - from[metric]) : null;
  const vsYesterday = delta(yesterday, now);
  const inLater = delta(now, later);

  const stats: { label: string; value: React.ReactNode }[] = [
    {
      label: "vs yday",
      value:
        vsYesterday == null ? "–" : (
          <span className={tone(vsYesterday)}>{signed(vsYesterday)}</span>
        ),
    },
    {
      label: `in ${LOOKAHEAD_HOURS}h`,
      value:
        inLater == null ? "–" : (
          <span className={tone(inLater)}>{signed(inLater)}</span>
        ),
    },
    {
      label: `next ${OUTLOOK_HOURS}h`,
      value: outlookValues.length
        ? `${Math.round(Math.max(...outlookValues))}°/${Math.round(Math.min(...outlookValues))}°`
        : "–",
    },
    {
      label: `rain ${OUTLOOK_HOURS}h`,
      value: rain > 0 ? `${rain.toFixed(1)}mm` : "none",
    },
    { label: `wind ${windUnit}`, value: Math.round(current.windSpeed) },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums">
          {Math.round(lead)}
          {temperatureUnit}
        </span>
        <div className="min-w-0 flex-1 text-xs leading-snug text-slate-400">
          <div>
            {secondaryLabel}{" "}
            <span className="tabular-nums text-slate-200">
              {Math.round(secondary)}°
            </span>
          </div>
          <div className="truncate">
            {sky.text} · 💧 {current.humidity}%
          </div>
        </div>
        <span
          className="shrink-0 text-3xl leading-none"
          role="img"
          aria-label={sky.text}
        >
          {sky.icon}
        </span>
      </div>
      <div className="grid grid-cols-5 divide-x divide-white/10 rounded-lg border border-white/10 bg-white/[0.03] text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="py-1">
            <div className="text-[10px] text-slate-500">{stat.label}</div>
            <div className="text-sm font-semibold tabular-nums text-slate-100">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

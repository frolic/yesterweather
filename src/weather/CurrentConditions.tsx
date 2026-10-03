import type { Forecast, Metric } from "./common.ts";
import { weatherCodeLabel } from "./weatherCodeLabel.ts";

const LOOKAHEAD_HOURS = 4;

/** Warmer reads red and colder reads blue. */
const tone = (delta: number) =>
  delta > 0 ? "text-red-400" : delta < 0 ? "text-blue-400" : "text-neutral-100";
const signed = (delta: number) => `${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${Math.abs(delta)}°`;

/**
 * "Right now" block: the active metric as one big number, and beside it three
 * short lines — sky, and the change vs this hour yesterday
 * and in 4 hours. Comparisons come from the flat hourly timeline, so they
 * cross midnight cleanly.
 */
export function CurrentConditions(props: { forecast: Forecast; metric: Metric }) {
  const { forecast, metric } = props;
  const { hourly, current } = forecast;
  const sky = weatherCodeLabel(current.weatherCode);

  const lead = metric === "feels" ? current.feels : current.actual;

  const nowIndex = hourly.findIndex(
    (reading) => reading.dateKey === current.dateKey && reading.hour === current.hour,
  );
  const now = hourly[nowIndex];
  const yesterday = hourly[nowIndex - 24];
  const later = hourly[nowIndex + LOOKAHEAD_HOURS];

  const delta = (from?: typeof now, to?: typeof now) =>
    from && to ? Math.round(to[metric] - from[metric]) : null;
  const changes = [
    { label: "vs yesterday", delta: delta(yesterday, now) },
    { label: `in ${LOOKAHEAD_HOURS} hours`, delta: delta(now, later) },
  ].flatMap((change) => (change.delta == null ? [] : [{ ...change, delta: change.delta }]));

  return (
    <section className="flex items-end justify-between gap-4">
      <div>
        <div className="text-[80px] font-semibold leading-none tracking-tighter tabular-nums text-neutral-50">
          {Math.round(lead)}°
        </div>
      </div>
      <ul className="text-right text-[15px] leading-6 text-neutral-400">
        <li>
          {sky.text} <span aria-hidden="true">{sky.icon}</span>
        </li>
        {changes.map((change) => (
          <li key={change.label}>
            <span className={`tabular-nums ${tone(change.delta)}`}>{signed(change.delta)}</span>{" "}
            {change.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

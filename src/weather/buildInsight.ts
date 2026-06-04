import type { Forecast, Metric } from "./common.ts";

const LOOKAHEAD_HOURS = 4;

const magnitude = (delta: number) =>
  `${Math.abs(delta)}° ${delta > 0 ? "warmer" : "colder"}`;

/**
 * The headline nudge: how right-now compares to the same hour yesterday and to
 * a few hours from now, on the active metric. Deltas come from the flat hourly
 * series so the lookahead crosses midnight cleanly. `delta` is the vs-yesterday
 * value, used to tint the banner. Returns null if "now" can't be located.
 */
export function buildInsight(
  forecast: Forecast,
  metric: Metric,
): { delta: number; message: string } | null {
  const { hourly, current } = forecast;
  const nowIndex = hourly.findIndex(
    (reading) =>
      reading.dateKey === current.dateKey && reading.hour === current.hour,
  );
  if (nowIndex < 0) return null;

  const now = hourly[nowIndex][metric];
  const yesterday = hourly[nowIndex - 24]?.[metric];
  const later = hourly[nowIndex + LOOKAHEAD_HOURS]?.[metric];

  const clauses: string[] = [];
  let primary: number | null = null;

  if (yesterday != null) {
    const delta = Math.round(now - yesterday);
    primary = delta;
    clauses.push(
      delta === 0
        ? "about the same as this time yesterday"
        : `${magnitude(delta)} than this time yesterday`,
    );
  }

  if (later != null) {
    const delta = Math.round(later - now);
    if (primary == null) primary = delta;
    clauses.push(
      delta === 0
        ? `about the same in ${LOOKAHEAD_HOURS} hours`
        : `${magnitude(delta)} in ${LOOKAHEAD_HOURS} hours`,
    );
  }

  if (!clauses.length || primary == null) return null;

  const lens = metric === "feels" ? "feels" : "is";
  return {
    delta: primary,
    message: `Right now it ${lens} ${clauses.join(", and ")}.`,
  };
}

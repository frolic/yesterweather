import type { DaySeries, Forecast } from "./common.ts";
import { weekdayLabel } from "./weekdayLabel.ts";

/** Whole-day difference between two "YYYY-MM-DD" keys (b - a), DST-safe. */
const dayDiff = (a: string, b: string) => {
  const millis =
    new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime();
  return Math.round(millis / 86_400_000);
};

/**
 * Split flat hourly readings into per-day series, each tagged with its offset
 * from today (derived from the forecast's "current" day) and a friendly label.
 * Ordered oldest → newest.
 */
export function groupByDay(forecast: Forecast): DaySeries[] {
  const today = forecast.current.dateKey;
  const byDay = new Map<string, DaySeries>();

  for (const reading of forecast.hourly) {
    let series = byDay.get(reading.dateKey);
    if (!series) {
      const offset = dayDiff(today, reading.dateKey);
      series = {
        dateKey: reading.dateKey,
        offset,
        label: weekdayLabel(reading.dateKey),
        readings: [],
      };
      byDay.set(reading.dateKey, series);
    }
    series.readings.push(reading);
  }

  return [...byDay.values()].sort((a, b) => a.offset - b.offset);
}

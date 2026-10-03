import type { DaySeries, Forecast } from "./common.ts";
import { weekdayLabel } from "./weekdayLabel.ts";

/** Hours either side of "now" that each day's window spans. */
export const HALF_WINDOW = 12;

/** Day offsets shown, oldest → newest. */
const OFFSETS = [-2, -1, 0, 1, 2];

/** "YYYY-MM-DD" shifted by whole days, DST-safe. */
const shiftDateKey = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * Cut the flat hourly timeline into one continuous 25-hour window per day,
 * each centred on "this hour" that many days from today (−12h … now … +12h).
 *
 * Windows are sliced from the timeline by index, not grouped by calendar date,
 * so a line crosses midnight into the next morning instead of wrapping back to
 * the early hours of its own date. Slots outside the fetched range are left
 * undefined. Ordered oldest → newest.
 */
export function groupByDay(forecast: Forecast): DaySeries[] {
  const { hourly, current } = forecast;
  const nowIndex = hourly.findIndex(
    (reading) => reading.dateKey === current.dateKey && reading.hour === current.hour,
  );
  if (nowIndex < 0) return [];

  return OFFSETS.map((offset) => {
    const center = nowIndex + offset * 24;
    const slots = Array.from(
      { length: HALF_WINDOW * 2 + 1 },
      (_, index) => hourly[center - HALF_WINDOW + index],
    );
    const dateKey = shiftDateKey(current.dateKey, offset);
    return { dateKey, offset, label: weekdayLabel(dateKey), slots };
  }).filter((day) => day.slots.some(Boolean));
}

import type { DaySeries, Metric } from "../weather/common.ts";
import { HALF_WINDOW } from "../weather/groupByDay.ts";

export type DiffCell = {
  dateKey: string;
  /** Absolute temperature shown in the cell; null if the reading is missing. */
  value: number | null;
  /** Rounded degrees vs today at the same hour, driving the cell colour. */
  delta: number | null;
  /** Rain in mm for the hour (0 when dry or missing). */
  precipitation: number;
  isToday: boolean;
};

export type DiffRow = {
  /** Hours from now, −12 … +11. */
  rel: number;
  hour: number;
  /** True when this row is the first hour of a new calendar day. */
  startsDay: boolean;
  cells: DiffCell[];
};

export type DiffGrid = {
  days: { dateKey: string; label: string; offset: number }[];
  rows: DiffRow[];
  /** Degrees that map to full colour intensity (floored so tiny diffs stay pale). */
  maxAbs: number;
  /** Largest hourly rain in the grid, for scaling the rain bars. */
  maxRain: number;
};

/**
 * Builds the hours × days matrix of temperatures, with each cell's delta versus
 * today at the same relative hour driving its colour. Rows run −12h … now …
 * +11h along each day's continuous window, so the rows after midnight hold the
 * next morning. Today's column is the all-zero baseline. Returns null when
 * today isn't present in the series.
 */
export function buildDiffGrid(
  series: DaySeries[],
  metric: Metric,
  currentHour: number,
): DiffGrid | null {
  const today = series.find((day) => day.offset === 0);
  if (!today) return null;

  const days = series.map((day) => ({
    dateKey: day.dateKey,
    label: day.label,
    offset: day.offset,
  }));

  let actualMax = 0;
  let maxRain = 0;
  const rows: DiffRow[] = [];
  for (let rel = -HALF_WINDOW; rel < HALF_WINDOW; rel += 1) {
    const hour = (((currentHour + rel) % 24) + 24) % 24;
    const reference = today.slots[rel + HALF_WINDOW]?.[metric];
    const cells = series.map((day) => {
      const reading = day.slots[rel + HALF_WINDOW];
      const raw = reading?.[metric];
      const value = raw != null ? Math.round(raw) : null;
      const delta =
        raw != null && reference != null ? Math.round(raw - reference) : null;
      if (delta != null) actualMax = Math.max(actualMax, Math.abs(delta));
      const precipitation = reading?.precipitation ?? 0;
      maxRain = Math.max(maxRain, precipitation);
      return {
        dateKey: day.dateKey,
        value,
        delta,
        precipitation,
        isToday: day.offset === 0,
      };
    });
    rows.push({ rel, hour, startsDay: hour === 0 && rel > -HALF_WINDOW, cells });
  }

  return { days, rows, maxAbs: Math.max(3, actualMax), maxRain };
}

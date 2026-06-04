import type { DaySeries, Metric } from "../weather/common.ts";

export type DiffCell = {
  dateKey: string;
  /** Absolute temperature shown in the cell; null if the reading is missing. */
  value: number | null;
  /** Rounded degrees vs today at the same hour, driving the cell colour. */
  delta: number | null;
  isToday: boolean;
};

export type DiffRow = { hour: number; cells: DiffCell[] };

export type DiffGrid = {
  days: { dateKey: string; label: string; offset: number }[];
  rows: DiffRow[];
  /** Degrees that map to full colour intensity (floored so tiny diffs stay pale). */
  maxAbs: number;
};

/**
 * Builds the hours × days matrix of temperature differences relative to today
 * at the same clock hour, on the active metric. Today's column is all-zero (the
 * baseline). Returns null when today isn't present in the series.
 */
export function buildDiffGrid(
  series: DaySeries[],
  metric: Metric,
): DiffGrid | null {
  const today = series.find((day) => day.offset === 0);
  if (!today) return null;

  const todayByHour = new Map<number, number>();
  for (const reading of today.readings) {
    todayByHour.set(reading.hour, reading[metric]);
  }

  const days = series.map((day) => ({
    dateKey: day.dateKey,
    label: day.label,
    offset: day.offset,
  }));

  let actualMax = 0;
  const rows: DiffRow[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const reference = todayByHour.get(hour);
    const cells = series.map((day) => {
      const raw = day.readings.find((reading) => reading.hour === hour)?.[metric];
      const value = raw != null ? Math.round(raw) : null;
      const delta =
        raw != null && reference != null ? Math.round(raw - reference) : null;
      if (delta != null) actualMax = Math.max(actualMax, Math.abs(delta));
      return { dateKey: day.dateKey, value, delta, isToday: day.offset === 0 };
    });
    rows.push({ hour, cells });
  }

  return { days, rows, maxAbs: Math.max(3, actualMax) };
}

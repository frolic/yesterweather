import { useEffect, useState } from "react";

const STORAGE_KEY = "yesterweather.hiddenOffsets";
/** Hide the ±2-day lines by default, so the chart opens on just
 * yesterday / today / tomorrow. */
const DEFAULT_HIDDEN = [-2, 2];

const readStored = (): Set<number> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set(DEFAULT_HIDDEN);
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value) => typeof value === "number"))
      : new Set(DEFAULT_HIDDEN);
  } catch {
    return new Set(DEFAULT_HIDDEN);
  }
};

/**
 * Tracks which day lines are hidden in the chart, keyed by offset from today so
 * the choice stays meaningful as the dates roll over. Persists to localStorage.
 */
export function useHiddenOffsets() {
  const [hiddenOffsets, setHiddenOffsets] = useState<Set<number>>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...hiddenOffsets]));
    } catch {
      // Ignore storage failures (private mode, quota).
    }
  }, [hiddenOffsets]);

  const toggleOffset = (offset: number) =>
    setHiddenOffsets((prev) => {
      const next = new Set(prev);
      next.has(offset) ? next.delete(offset) : next.add(offset);
      return next;
    });

  return { hiddenOffsets, toggleOffset };
}

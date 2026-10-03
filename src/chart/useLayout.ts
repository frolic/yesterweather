import { useEffect, useState } from "react";

export type Layout = "rows" | "charts";

const STORAGE_KEY = "yesterweather.layout";

const readStored = (): Layout => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "charts" ? "charts" : "rows";
  } catch {
    return "rows";
  }
};

/** Which view shows the days: one row per day, or stacked overlay charts.
 * Persisted to localStorage. */
export function useLayout() {
  const [layout, setLayout] = useState<Layout>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, layout);
    } catch {
      // Ignore storage failures (private mode, quota).
    }
  }, [layout]);

  return { layout, setLayout };
}

import { useEffect, useState } from "react";
import type { Metric, Unit } from "./common.ts";

const STORAGE_KEY = "yesterweather.display";

type DisplaySettings = { metric: Metric; unit: Unit };
const DEFAULTS: DisplaySettings = { metric: "feels", unit: "celsius" };

const readStored = (): DisplaySettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    // Validate so a stale value can't, e.g., send a bad unit to the API.
    return {
      metric: parsed?.metric === "actual" ? "actual" : "feels",
      unit: parsed?.unit === "fahrenheit" ? "fahrenheit" : "celsius",
    };
  } catch {
    return DEFAULTS;
  }
};

/**
 * Holds the temperature display preferences (feels-like vs actual, °C vs °F),
 * persisted together to localStorage so the app reopens how you left it.
 */
export function useDisplaySettings() {
  const [settings, setSettings] = useState<DisplaySettings>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage failures (private mode, quota).
    }
  }, [settings]);

  const setMetric = (metric: Metric) =>
    setSettings((prev) => ({ ...prev, metric }));
  const setUnit = (unit: Unit) => setSettings((prev) => ({ ...prev, unit }));

  return { metric: settings.metric, unit: settings.unit, setMetric, setUnit };
}

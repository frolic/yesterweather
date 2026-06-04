import { useEffect, useState } from "react";
import type { Place } from "../location/common.ts";
import type { Forecast } from "./common.ts";
import { fetchForecast } from "./fetchForecast.ts";

type ForecastState = {
  data: Forecast | null;
  loading: boolean;
  error: string | null;
};

/**
 * Loads the forecast for a place + unit, cancelling in-flight requests when the
 * inputs change so the latest selection always wins.
 */
export function useForecast(place: Place, unit: "celsius" | "fahrenheit") {
  const [state, setState] = useState<ForecastState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchForecast({
      latitude: place.latitude,
      longitude: place.longitude,
      unit,
      signal: controller.signal,
    })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "Something went wrong";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      });

    return () => controller.abort();
  }, [place.latitude, place.longitude, unit]);

  return state;
}

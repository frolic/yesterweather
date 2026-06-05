import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Place } from "../location/common.ts";
import type { Unit } from "./common.ts";
import { fetchForecast } from "./fetchForecast.ts";

/** How often to silently re-fetch so "now" and current conditions stay live. */
const REFRESH_MS = 5 * 60 * 1000;

/**
 * Loads the forecast for a place + unit via TanStack Query: cached per
 * place+unit, refetched every few minutes and on window focus/reconnect, with
 * the previous reading kept on screen during a refresh so there's no flicker.
 */
export function useForecast(place: Place, unit: Unit) {
  const query = useQuery({
    queryKey: ["forecast", place.latitude, place.longitude, unit],
    queryFn: ({ signal }) =>
      fetchForecast({
        latitude: place.latitude,
        longitude: place.longitude,
        unit,
        signal,
      }),
    refetchInterval: REFRESH_MS,
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Something went wrong"
          : null,
  };
}

import { useCallback, useEffect, useState } from "react";
import type { Place } from "./common.ts";
import { reverseGeocode } from "./reverseGeocode.ts";

const STORAGE_KEY = "yesterweather.place";

const DEFAULT_PLACE: Place = {
  name: "London",
  region: "England, United Kingdom",
  latitude: 51.5074,
  longitude: -0.1278,
};

const readStored = (): Place | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Place) : null;
  } catch {
    return null;
  }
};

/**
 * Holds the active place, persisting the last choice to localStorage. Exposes a
 * setter for search results and a `locate()` that resolves the device's GPS
 * position. Falls back to a sensible default on first run.
 */
export function useLocation() {
  const [place, setPlaceState] = useState<Place>(
    () => readStored() ?? DEFAULT_PLACE,
  );
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
    } catch {
      // Ignore storage failures (private mode, quota) — not worth surfacing.
    }
  }, [place]);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        // Show coordinates straight away so the forecast loads, then patch in
        // the resolved place name once reverse geocoding returns.
        setPlaceState({
          name: "Current location",
          region: "Locating…",
          latitude,
          longitude,
        });
        reverseGeocode(latitude, longitude)
          .then(setPlaceState)
          .catch(() => {
            /* keep the coordinate fallback if reverse geocoding fails */
          });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, []);

  return { place, setPlace: setPlaceState, locate, locating };
}

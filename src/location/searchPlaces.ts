import type { Place } from "./common.ts";

const ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

type RawPlace = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

const regionOf = (place: RawPlace) =>
  [place.admin1, place.country].filter(Boolean).join(", ");

/** Look up places by name via Open-Meteo geocoding, newest query wins. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: "6",
    language: "en",
    format: "json",
  });

  const response = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);

  const raw: { results?: RawPlace[] } = await response.json();
  return (raw.results ?? []).map((place) => ({
    name: place.name,
    region: regionOf(place),
    latitude: place.latitude,
    longitude: place.longitude,
  }));
}

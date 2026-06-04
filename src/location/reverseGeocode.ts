import type { Place } from "./common.ts";

const ENDPOINT = "https://api.bigdatacloud.net/data/reverse-geocode-client";

type RawReverse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

/** Turn GPS coordinates into a named place. Open-Meteo's geocoding is
 * forward-only, so this uses BigDataCloud's keyless reverse endpoint; falls
 * back to a generic label when no locality is returned. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<Place> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "en",
  });

  const response = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!response.ok) throw new Error(`Reverse geocode failed (${response.status})`);

  const raw: RawReverse = await response.json();
  const name =
    raw.city || raw.locality || raw.principalSubdivision || "Current location";
  const region = [raw.principalSubdivision, raw.countryName]
    .filter(Boolean)
    .join(", ");

  return { name, region, latitude, longitude };
}

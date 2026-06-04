/** A resolved place the forecast is shown for. */
export type Place = {
  name: string;
  /** e.g. "England, United Kingdom" — shown under the name for disambiguation. */
  region: string;
  latitude: number;
  longitude: number;
};

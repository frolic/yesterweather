/** The two temperature lenses the app can show. "feels" is apparent temperature
 * (wind chill / humidity adjusted), which is the headline metric. */
export type Metric = "feels" | "actual";

/** Temperature unit system, as accepted by the Open-Meteo API. */
export type Unit = "celsius" | "fahrenheit";

/** A single hourly reading, with the local clock hour pre-parsed for overlaying. */
export type HourReading = {
  /** Local time ISO string from the API, e.g. "2026-06-02T14:00". */
  time: string;
  /** Local clock hour 0–23, used as the shared x-axis across days. */
  hour: number;
  /** Calendar day in local time, "YYYY-MM-DD". */
  dateKey: string;
  actual: number;
  feels: number;
  windSpeed: number;
  /** Precipitation amount for the hour, in mm. */
  precipitation: number;
};

/** Current "right now" conditions for the header. */
export type CurrentConditions = {
  dateKey: string;
  hour: number;
  actual: number;
  feels: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
};

export type Forecast = {
  timezone: string;
  temperatureUnit: string;
  current: CurrentConditions;
  hourly: HourReading[];
};

/** One calendar day's worth of readings, positioned relative to today. */
export type DaySeries = {
  dateKey: string;
  /** Days from today: -2, -1, 0 (today), +1 … */
  offset: number;
  label: string;
  readings: HourReading[];
};

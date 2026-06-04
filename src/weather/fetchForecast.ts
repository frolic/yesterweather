import type { Forecast, HourReading, Unit } from "./common.ts";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

const dateKeyOf = (localIso: string) => localIso.slice(0, 10);
const hourOf = (localIso: string) => Number(localIso.slice(11, 13));

type RawResponse = {
  timezone: string;
  hourly_units: { temperature_2m: string };
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    wind_speed_10m: number[];
    precipitation: number[];
  };
};

/**
 * Fetch a week-wide hourly forecast (a couple of days back through several days
 * ahead) for a coordinate. `timezone=auto` makes the API return local-clock
 * times, so hour-of-day overlays need no timezone math.
 */
export async function fetchForecast(options: {
  latitude: number;
  longitude: number;
  unit: Unit;
  pastDays?: number;
  forecastDays?: number;
  signal?: AbortSignal;
}): Promise<Forecast> {
  const {
    latitude,
    longitude,
    unit,
    pastDays = 2,
    forecastDays = 3,
    signal,
  } = options;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly:
      "temperature_2m,apparent_temperature,wind_speed_10m,precipitation",
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    temperature_unit: unit,
    wind_speed_unit: unit === "fahrenheit" ? "mph" : "kmh",
    timezone: "auto",
    past_days: String(pastDays),
    forecast_days: String(forecastDays),
  });

  const response = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }
  const raw: RawResponse = await response.json();

  const hourly: HourReading[] = raw.hourly.time.map((time, index) => ({
    time,
    hour: hourOf(time),
    dateKey: dateKeyOf(time),
    actual: raw.hourly.temperature_2m[index],
    feels: raw.hourly.apparent_temperature[index],
    windSpeed: raw.hourly.wind_speed_10m[index],
    precipitation: raw.hourly.precipitation[index],
  }));

  return {
    timezone: raw.timezone,
    temperatureUnit: raw.hourly_units.temperature_2m,
    current: {
      dateKey: dateKeyOf(raw.current.time),
      hour: hourOf(raw.current.time),
      actual: raw.current.temperature_2m,
      feels: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      windSpeed: raw.current.wind_speed_10m,
      weatherCode: raw.current.weather_code,
    },
    hourly,
  };
}

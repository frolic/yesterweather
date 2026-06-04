import type { HourReading, Metric, Unit } from "../weather/common.ts";

/** Which hourly variable the overlay chart plots. */
export type ChartVariable = "temperature" | "wind" | "rain";

/** How to read and label a variable on the chart: the value accessor, the
 * tooltip unit, a short axis suffix (kept narrow so it never clips the y-axis),
 * and whether the y-axis should be floored at zero. */
export type ChartView = {
  value: (reading: HourReading) => number;
  /** Formats a value for the tooltip (e.g. integer degrees, one-decimal mm). */
  format: (value: number) => string;
  unitSymbol: string;
  axisSuffix: string;
  clampZero: boolean;
  /** Fixed y-axis range; when omitted the chart auto-fits to the data. */
  domain?: [number, number];
};

const rounded = (value: number) => String(Math.round(value));

export function chartView(options: {
  variable: ChartVariable;
  metric: Metric;
  unit: Unit;
  temperatureUnit: string;
}): ChartView {
  const { variable, metric, unit, temperatureUnit } = options;

  if (variable === "wind") {
    return {
      value: (reading) => reading.windSpeed,
      format: rounded,
      unitSymbol: unit === "fahrenheit" ? " mph" : " km/h",
      axisSuffix: "",
      clampZero: true,
    };
  }

  if (variable === "rain") {
    return {
      value: (reading) => reading.precipitation,
      format: (value) => value.toFixed(1),
      unitSymbol: " mm",
      axisSuffix: "mm",
      clampZero: true,
    };
  }

  return {
    value: (reading) => reading[metric],
    format: rounded,
    unitSymbol: temperatureUnit,
    axisSuffix: "°",
    clampZero: false,
  };
}

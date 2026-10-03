import { useMemo, useState } from "react";
import { DayLegend } from "../chart/DayLegend.tsx";
import { OverlayChart } from "../chart/OverlayChart.tsx";
import { TemperatureGrid } from "../chart/TemperatureGrid.tsx";
import { VariableTabs } from "../chart/VariableTabs.tsx";
import { chartView, type ChartVariable } from "../chart/chartVariable.ts";
import { useHiddenOffsets } from "../chart/useHiddenOffsets.ts";
import { PlaceSearch } from "../location/PlaceSearch.tsx";
import { useLocation } from "../location/useLocation.ts";
import { buildInsight } from "../weather/buildInsight.ts";
import { CurrentConditions } from "../weather/CurrentConditions.tsx";
import { groupByDay } from "../weather/groupByDay.ts";
import { MetricToggle } from "../weather/MetricToggle.tsx";
import { UnitToggle } from "../weather/UnitToggle.tsx";
import { useDisplaySettings } from "../weather/useDisplaySettings.ts";
import { useForecast } from "../weather/useForecast.ts";

const VERSION = __COMMIT_SHA__ ? __COMMIT_SHA__.slice(0, 7) : "dev";

export function App() {
  const { place, setPlace, locate, locating } = useLocation();
  const { metric, unit, setMetric, setUnit } = useDisplaySettings();
  const { hiddenOffsets, toggleOffset } = useHiddenOffsets();
  const [variable, setVariable] = useState<ChartVariable>("temperature");

  const { data, loading, error } = useForecast(place, unit);

  const series = useMemo(() => (data ? groupByDay(data) : []), [data]);
  const insight = useMemo(
    () => (data ? buildInsight(data, metric) : null),
    [data, metric],
  );

  const unitSymbol = data?.temperatureUnit ?? "°C";
  const windUnit = unit === "fahrenheit" ? "mph" : "km/h";
  const view = chartView({ variable, metric, unit, temperatureUnit: unitSymbol });

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-3 px-3 pb-6 pt-4">
      <PlaceSearch
        place={place}
        onSelect={setPlace}
        onLocate={locate}
        locating={locating}
      />

      <main className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          {error && (
            <div className="py-8 text-center text-sm text-rose-300">{error}</div>
          )}

          {!error && loading && !data && (
            <div className="py-10 text-center text-sm text-slate-400">
              Loading forecast…
            </div>
          )}

          {!error && data && (
            <CurrentConditions
              conditions={data.current}
              metric={metric}
              unitSymbol={unitSymbol}
              windUnit={windUnit}
            />
          )}

          {insight && (
            <p
              className={`border-l-2 pl-2 text-xs leading-snug ${
                insight.delta < 0
                  ? "border-sky-400/60 text-sky-200"
                  : insight.delta > 0
                    ? "border-amber-400/60 text-amber-200"
                    : "border-white/20 text-slate-300"
              }`}
            >
              {insight.message}
            </p>
          )}
        </section>

        <div className="flex items-center justify-between gap-1">
          <VariableTabs value={variable} onChange={setVariable} />
          <div className="flex items-center gap-1">
            <MetricToggle value={metric} onChange={setMetric} />
            <UnitToggle value={unit} onChange={setUnit} />
          </div>
        </div>

        {data && (
          <>
            <section className="flex flex-col gap-1">
              <DayLegend
                series={series}
                hiddenOffsets={hiddenOffsets}
                onToggle={toggleOffset}
              />
              <OverlayChart
                series={series}
                value={view.value}
                format={view.format}
                unitSymbol={view.unitSymbol}
                axisSuffix={view.axisSuffix}
                clampZero={view.clampZero}
                domain={view.domain}
                currentHour={data.current.hour}
                hiddenOffsets={hiddenOffsets}
              />
            </section>

            <section>
              <TemperatureGrid
                series={series}
                metric={metric}
                currentHour={data.current.hour}
              />
            </section>
          </>
        )}
      </main>

      <footer className="mt-auto pt-4 text-center text-[10px] text-slate-600">
        Data from Open-Meteo · {VERSION}
      </footer>
    </div>
  );
}

import { useMemo } from "react";
import { ChartStack } from "../chart/ChartStack.tsx";
import { DayLegend } from "../chart/DayLegend.tsx";
import { useHiddenOffsets } from "../chart/useHiddenOffsets.ts";
import { PlaceSearch } from "../location/PlaceSearch.tsx";
import { useLocation } from "../location/useLocation.ts";
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

  const { data, loading, error } = useForecast(place, unit);

  const series = useMemo(() => (data ? groupByDay(data) : []), [data]);
  const windUnit = unit === "fahrenheit" ? "mph" : "km/h";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-3 px-3 pb-6 pt-4">
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <PlaceSearch
            place={place}
            onSelect={setPlace}
            onLocate={locate}
            locating={locating}
          />
        </div>
        <MetricToggle value={metric} onChange={setMetric} />
        <UnitToggle value={unit} onChange={setUnit} />
      </div>

      <main className="flex flex-col gap-3">
        {error && (
          <div className="py-8 text-center text-sm text-rose-300">{error}</div>
        )}

        {!error && loading && !data && (
          <div className="py-10 text-center text-sm text-slate-400">
            Loading forecast…
          </div>
        )}

        {!error && data && (
          <>
            <CurrentConditions
              forecast={data}
              metric={metric}
              windUnit={windUnit}
            />
            <section className="flex flex-col gap-1">
              <DayLegend
                series={series}
                hiddenOffsets={hiddenOffsets}
                onToggle={toggleOffset}
              />
              <ChartStack
                series={series}
                metric={metric}
                unit={unit}
                temperatureUnit={data.temperatureUnit}
                currentHour={data.current.hour}
                hiddenOffsets={hiddenOffsets}
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

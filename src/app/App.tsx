import { useMemo } from "react";
import { ChartStack } from "../chart/ChartStack.tsx";
import { DayLegend } from "../chart/DayLegend.tsx";
import { DayRows } from "../chart/DayRows.tsx";
import { useLayout, type Layout } from "../chart/useLayout.ts";
import { useHiddenOffsets } from "../chart/useHiddenOffsets.ts";
import { useLocation } from "../location/useLocation.ts";
import { CurrentConditions } from "../weather/CurrentConditions.tsx";
import { groupByDay } from "../weather/groupByDay.ts";
import { useDisplaySettings } from "../weather/useDisplaySettings.ts";
import { useForecast } from "../weather/useForecast.ts";
import { Header } from "./Header.tsx";
import { Tabs } from "./Tabs.tsx";

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: "charts", label: "Elements" },
  { value: "rows", label: "Days" },
];

const VERSION = __COMMIT_SHA__ ? __COMMIT_SHA__.slice(0, 7) : "dev";

export function App() {
  const { place, setPlace, locate, locating } = useLocation();
  const { metric, unit, setMetric, setUnit } = useDisplaySettings();
  const { hiddenOffsets, toggleOffset } = useHiddenOffsets();
  const { layout, setLayout } = useLayout();

  const { data, loading, error } = useForecast(place, unit);

  const series = useMemo(() => (data ? groupByDay(data) : []), [data]);
  const windUnit = unit === "fahrenheit" ? "mph" : "km/h";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-5 pb-3 pt-4">
      <Header
        place={place}
        onSelect={setPlace}
        onLocate={locate}
        locating={locating}
        metric={metric}
        onMetricChange={setMetric}
        unit={unit}
        onUnitChange={setUnit}
        now={data?.current}
      />

      <main className="flex flex-col gap-4">
        {error && <div className="py-8 text-center text-sm text-red-300">{error}</div>}

        {!error && loading && !data && (
          <div className="py-10 text-center font-mono text-sm text-neutral-500">
            Loading forecast…
          </div>
        )}

        {!error && data && (
          <>
            <CurrentConditions forecast={data} metric={metric} />
            <section className="flex flex-col gap-3">
              <Tabs label="View" options={LAYOUTS} value={layout} onChange={setLayout} />
              {layout === "rows" ? (
                <DayRows
                  series={series}
                  metric={metric}
                  currentHour={data.current.hour}
                  windUnit={windUnit}
                />
              ) : (
                <>
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
                </>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="mt-auto pt-6 text-center font-mono text-[10px] uppercase tracking-wider text-neutral-600">
        Data from Open-Meteo · {VERSION}
      </footer>
    </div>
  );
}

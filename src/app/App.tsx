import { useMemo, useState } from "react";
import { TemperatureChart } from "../chart/TemperatureChart.tsx";
import { TemperatureGrid } from "../chart/TemperatureGrid.tsx";
import { PlaceSearch } from "../location/PlaceSearch.tsx";
import { useLocation } from "../location/useLocation.ts";
import type { Metric } from "../weather/common.ts";
import { buildInsight } from "../weather/buildInsight.ts";
import { CurrentConditions } from "../weather/CurrentConditions.tsx";
import { groupByDay } from "../weather/groupByDay.ts";
import { MetricToggle } from "../weather/MetricToggle.tsx";
import { useForecast } from "../weather/useForecast.ts";

type Unit = "celsius" | "fahrenheit";

export function App() {
  const { place, setPlace, locate, locating } = useLocation();
  const [unit, setUnit] = useState<Unit>("celsius");
  const [metric, setMetric] = useState<Metric>("feels");
  const [hiddenDays, setHiddenDays] = useState<Set<string>>(new Set());

  const { data, loading, error } = useForecast(place, unit);

  const series = useMemo(() => (data ? groupByDay(data) : []), [data]);
  const insight = useMemo(
    () => (data ? buildInsight(data, metric) : null),
    [data, metric],
  );

  const toggleDay = (dateKey: string) =>
    setHiddenDays((prev) => {
      const next = new Set(prev);
      next.has(dateKey) ? next.delete(dateKey) : next.add(dateKey);
      return next;
    });

  const unitSymbol = data?.temperatureUnit ?? "°C";
  const windUnit = unit === "fahrenheit" ? "mph" : "km/h";
  const dayRange = series.length
    ? `past ${-series[0].offset} → next ${series[series.length - 1].offset} days`
    : "";
  const metricLabel = metric === "feels" ? "feels like" : "actual";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Yesterweather</h1>
          <p className="text-xs text-slate-400">
            Today, against the days you just felt.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUnit((u) => (u === "celsius" ? "fahrenheit" : "celsius"))}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          {unit === "celsius" ? "°C" : "°F"}
        </button>
      </header>

      <PlaceSearch
        place={place}
        onSelect={setPlace}
        onLocate={locate}
        locating={locating}
      />

      <main className="flex flex-col gap-4">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              {place.name}
            </span>
            <MetricToggle value={metric} onChange={setMetric} />
          </div>

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
        </section>

        {insight && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm leading-relaxed ${
              insight.delta < 0
                ? "border-sky-400/20 bg-sky-400/[0.06] text-sky-100"
                : insight.delta > 0
                  ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-100"
                  : "border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            {insight.message}
          </div>
        )}

        {data && (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-medium text-slate-300">
                  Hourly · {metricLabel}
                </h2>
                <span className="text-xs text-slate-500">{dayRange}</span>
              </div>
              <TemperatureChart
                series={series}
                metric={metric}
                unitSymbol={unitSymbol}
                currentHour={data.current.hour}
                hiddenDays={hiddenDays}
                onToggleDay={toggleDay}
              />
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-medium text-slate-300">
                  Grid · {metricLabel}
                </h2>
                <span className="text-xs text-slate-500">shaded vs today</span>
              </div>
              <TemperatureGrid
                series={series}
                metric={metric}
                currentHour={data.current.hour}
              />
            </section>
          </>
        )}
      </main>

      <footer className="mt-auto pt-2 text-center text-xs text-slate-600">
        Data from Open-Meteo · times shown in {data?.timezone ?? "local time"}
      </footer>
    </div>
  );
}

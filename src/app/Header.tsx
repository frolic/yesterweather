import { useCallback, useState } from "react";
import type { Place } from "../location/common.ts";
import { PlaceSearch } from "../location/PlaceSearch.tsx";
import type { Metric, Unit } from "../weather/common.ts";
import { formatHour } from "../chart/formatHour.ts";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * Top bar: the place name is the page title (tap it to search), with the local
 * date and hour under it; the "use my location" button sits right after the
 * name. On the right sit two one-tap toggles: feels like / actual and °C / °F.
 */
export function Header(props: {
  place: Place;
  onSelect: (place: Place) => void;
  onLocate: () => void;
  locating: boolean;
  metric: Metric;
  onMetricChange: (metric: Metric) => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  /** Local "YYYY-MM-DD" and hour of the forecast's "now", when loaded. */
  now?: { dateKey: string; hour: number };
}) {
  const { place, onSelect, onLocate, locating, metric, onMetricChange, unit, onUnitChange, now } =
    props;
  const [searching, setSearching] = useState(false);
  const close = useCallback(() => setSearching(false), []);

  return (
    <header className="relative flex items-start gap-2">
      {/* While searching, the box covers only the place area; the place stays
          in the layout, hidden, so the page never moves. */}
      <div className="relative min-w-0 flex-1">
        {searching && (
          <div className="absolute inset-x-0 top-0 z-20">
            <PlaceSearch onSelect={onSelect} onClose={close} />
          </div>
        )}
        <div className={searching ? "invisible" : ""}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearching(true)}
              className="group flex min-w-0 items-center gap-1.5 text-left text-2xl font-semibold tracking-tight text-neutral-50"
              aria-label={`Change place, now ${place.name}`}
            >
              <span className="truncate">{place.name}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="h-4 w-4 shrink-0 text-neutral-500 transition group-hover:text-neutral-300"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onLocate}
              disabled={locating}
              aria-label="Use my location"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-white/5 hover:text-neutral-200 disabled:opacity-50"
            >
              {locating ? (
                <span className="text-sm">…</span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M3 11l18-8-8 18-2-8-8-2z" />
                </svg>
              )}
            </button>
          </div>
          <div className="mt-0.5 text-sm text-neutral-500">
            {now
              ? `${DATE_FORMAT.format(new Date(`${now.dateKey}T12:00:00Z`))} · ${formatHour(now.hour)}`
              : place.region}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 pt-0.5">
        <button
          type="button"
          onClick={() => onMetricChange(metric === "feels" ? "actual" : "feels")}
          aria-label="Switch between feels-like and actual temperature"
          className="-mx-2.5 h-9 whitespace-nowrap rounded-full px-2.5 text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-neutral-200"
        >
          {metric === "feels" ? "feels like" : "actual"}
        </button>
        <button
          type="button"
          onClick={() => onUnitChange(unit === "celsius" ? "fahrenheit" : "celsius")}
          aria-label="Switch between Celsius and Fahrenheit"
          className="-mx-2.5 h-9 rounded-full px-2.5 text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-neutral-200"
        >
          {unit === "celsius" ? "°C" : "°F"}
        </button>
      </div>
    </header>
  );
}

import { useEffect, useRef, useState } from "react";
import type { Place } from "./common.ts";
import { searchPlaces } from "./searchPlaces.ts";

/** Search box with debounced geocoding results and a "use my location" button.
 * Selecting a result (or locating) lifts the chosen place to the parent. */
export function PlaceSearch(props: {
  place: Place;
  onSelect: (place: Place) => void;
  onLocate: () => void;
  locating: boolean;
}) {
  const { place, onSelect, onLocate, locating } = props;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then(setResults)
        .catch(() => {
          /* ignore aborted / failed lookups */
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const choose = (next: Place) => {
    onSelect(next);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={place.name}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-amber-400/60 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          aria-label="Use my location"
          className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-lg transition hover:bg-white/10 disabled:opacity-50"
        >
          {locating ? "…" : "📍"}
        </button>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-xl backdrop-blur">
          {results.map((result) => (
            <li key={`${result.latitude},${result.longitude}`}>
              <button
                type="button"
                onClick={() => choose(result)}
                className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-white/5"
              >
                <span className="text-sm text-slate-100">{result.name}</span>
                <span className="text-xs text-slate-400">{result.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

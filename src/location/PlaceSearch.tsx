import { useEffect, useRef, useState } from "react";
import type { Place } from "./common.ts";
import { searchPlaces } from "./searchPlaces.ts";

/** Search box with debounced geocoding results. It opens focused; picking a
 * result lifts the place to the parent, and Escape or a tap outside closes it. */
export function PlaceSearch(props: { onSelect: (place: Place) => void; onClose: () => void }) {
  const { onSelect, onClose } = props;
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
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  const choose = (next: Place) => {
    onSelect(next);
    setQuery("");
    setResults([]);
    onClose();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
          autoFocus
          placeholder="Search for a city"
          className="h-12 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-base text-neutral-100 placeholder:text-neutral-400 focus:border-[#f2c94c]/60 focus:outline-none"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 shadow-xl backdrop-blur">
          {results.map((result) => (
            <li key={`${result.latitude},${result.longitude}`}>
              <button
                type="button"
                onClick={() => choose(result)}
                className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-white/5"
              >
                <span className="text-sm text-neutral-100">{result.name}</span>
                <span className="text-xs text-neutral-400">{result.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

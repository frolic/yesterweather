import type { ChartVariable } from "./chartVariable.ts";

const TABS: { value: ChartVariable; label: string }[] = [
  { value: "temperature", label: "Temperature" },
  { value: "wind", label: "Wind" },
  { value: "rain", label: "Rain" },
];

/** Heading-level tabs that switch which hourly variable the overlay chart plots. */
export function VariableTabs(props: {
  value: ChartVariable;
  onChange: (variable: ChartVariable) => void;
}) {
  return (
    <div className="flex gap-1 text-sm">
      {TABS.map((tab) => {
        const active = tab.value === props.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => props.onChange(tab.value)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              active
                ? "bg-white/15 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

import type { Metric } from "./common.ts";

const OPTIONS: { value: Metric; label: string }[] = [
  { value: "feels", label: "Feels like" },
  { value: "actual", label: "Actual" },
];

/** Segmented control switching the chart between apparent and actual temps. */
export function MetricToggle(props: {
  value: Metric;
  onChange: (metric: Metric) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
      {OPTIONS.map((option) => {
        const active = option.value === props.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => props.onChange(option.value)}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              active
                ? "bg-amber-400 text-slate-900"
                : "text-slate-300 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

import type { Metric } from "./common.ts";

const OPTIONS: { value: Metric; label: string }[] = [
  { value: "feels", label: "Feels" },
  { value: "actual", label: "Actual" },
];

/** On/off switch between apparent and actual temps — clicking anywhere on the
 * control flips it. */
export function MetricToggle(props: {
  value: Metric;
  onChange: (metric: Metric) => void;
}) {
  const next: Metric = props.value === "feels" ? "actual" : "feels";
  return (
    <button
      type="button"
      onClick={() => props.onChange(next)}
      aria-label="Toggle feels-like or actual temperature"
      className="inline-flex rounded-full border border-white/10 bg-white/5 p-0.5 text-xs"
    >
      {OPTIONS.map((option) => {
        const active = option.value === props.value;
        return (
          <span
            key={option.value}
            className={`rounded-full px-2.5 py-1 font-medium transition ${
              active ? "bg-amber-400 text-slate-900" : "text-slate-300"
            }`}
          >
            {option.label}
          </span>
        );
      })}
    </button>
  );
}

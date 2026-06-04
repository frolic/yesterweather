import type { Unit } from "./common.ts";

const OPTIONS: { value: Unit; label: string }[] = [
  { value: "celsius", label: "°C" },
  { value: "fahrenheit", label: "°F" },
];

/** On/off switch between Celsius and Fahrenheit — clicking anywhere flips it.
 * Neutral active style keeps the amber accent reserved for the metric toggle. */
export function UnitToggle(props: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  const next: Unit = props.value === "celsius" ? "fahrenheit" : "celsius";
  return (
    <button
      type="button"
      onClick={() => props.onChange(next)}
      aria-label="Toggle Celsius or Fahrenheit"
      className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm"
    >
      {OPTIONS.map((option) => {
        const active = option.value === props.value;
        return (
          <span
            key={option.value}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              active ? "bg-white/15 text-white" : "text-slate-400"
            }`}
          >
            {option.label}
          </span>
        );
      })}
    </button>
  );
}

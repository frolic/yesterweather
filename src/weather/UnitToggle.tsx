import type { Unit } from "./common.ts";

const OPTIONS: { value: Unit; label: string }[] = [
  { value: "celsius", label: "°C" },
  { value: "fahrenheit", label: "°F" },
];

/** Segmented control switching between Celsius and Fahrenheit. Uses a neutral
 * active style so the amber accent stays reserved for the primary metric toggle. */
export function UnitToggle(props: {
  value: Unit;
  onChange: (unit: Unit) => void;
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
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              active ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

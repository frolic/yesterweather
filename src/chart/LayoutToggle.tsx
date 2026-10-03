import type { Layout } from "./useLayout.ts";

const OPTIONS: { value: Layout; label: string }[] = [
  { value: "rows", label: "Rows" },
  { value: "charts", label: "Charts" },
];

/** Small text switch between the day-rows view and the stacked charts. */
export function LayoutToggle(props: {
  value: Layout;
  onChange: (layout: Layout) => void;
}) {
  return (
    <div className="flex gap-0.5 text-xs">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => props.onChange(option.value)}
          className={`rounded-full px-2.5 py-0.5 font-medium transition ${
            option.value === props.value
              ? "bg-white/15 text-white"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

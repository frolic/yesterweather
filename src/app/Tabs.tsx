/** Tab bar for switching whole views: the tabs sit on a full-width rule, and
 * the active one is bright with a bar under it. */
export function Tabs<Value extends string>(props: {
  label: string;
  options: { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div className="flex gap-5 border-b border-white/10" role="tablist" aria-label={props.label}>
      {props.options.map((option) => {
        const active = option.value === props.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => props.onChange(option.value)}
            className={`-mb-px border-b-2 pb-2 pt-1 text-sm font-semibold transition ${
              active
                ? "border-neutral-100 text-neutral-50"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

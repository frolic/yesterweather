import type { DaySeries } from "../weather/common.ts";
import { dayColor } from "./dayColor.ts";

/** Centred legend of day chips; tapping one hides/shows that day's line. */
export function DayLegend(props: {
  series: DaySeries[];
  hiddenOffsets: Set<number>;
  onToggle: (offset: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {props.series.map((day) => {
        const style = dayColor(day.offset);
        const hidden = props.hiddenOffsets.has(day.offset);
        return (
          <button
            key={day.dateKey}
            type="button"
            onClick={() => props.onToggle(day.offset)}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
              hidden
                ? "border-white/5 bg-transparent text-slate-500"
                : "border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: hidden ? "#475569" : style.color,
                opacity: hidden ? 0.5 : style.opacity,
              }}
            />
            {day.label}
          </button>
        );
      })}
    </div>
  );
}

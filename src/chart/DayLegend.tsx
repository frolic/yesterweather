import type { DaySeries } from "../weather/common.ts";
import { dayColor } from "./dayColor.ts";

/** Row of day toggles above the charts: a short line in the day's colour and
 * dash, then its name. Tapping one hides or shows that day's line; a hidden
 * day is dimmed. */
export function DayLegend(props: {
  series: DaySeries[];
  hiddenOffsets: Set<number>;
  onToggle: (offset: number) => void;
}) {
  return (
    <div className="flex justify-between">
      {props.series.map((day) => {
        const style = dayColor(day.offset);
        const hidden = props.hiddenOffsets.has(day.offset);
        return (
          <button
            key={day.dateKey}
            type="button"
            aria-pressed={!hidden}
            onClick={() => props.onToggle(day.offset)}
            className={`flex items-center gap-1.5 py-1 text-[13px] font-medium transition ${
              hidden ? "text-neutral-600" : "text-neutral-200"
            }`}
          >
            <svg width="18" height="6" aria-hidden="true" className="shrink-0">
              <line
                x1="1"
                x2="17"
                y1="3"
                y2="3"
                stroke={style.color}
                strokeOpacity={hidden ? 0.35 : 1}
                strokeWidth={2.5}
                strokeDasharray={style.dash ? "4 3" : undefined}
              />
            </svg>
            {day.label}
          </button>
        );
      })}
    </div>
  );
}

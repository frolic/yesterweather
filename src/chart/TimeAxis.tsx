import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { formatHour } from "./formatHour.ts";

/** Relative-hour ticks, including 0 (the now hour) at centre. */
const TICKS = [-12, -6, 0, 6, 12];
export const TIME_AXIS_HEIGHT = 18;

/**
 * Clock-hour labels above a −12h … now … +12h plot, with a pill that follows
 * the time cursor. The pill reads "now" while the cursor rests; labels it
 * would cover fade out.
 */
export function TimeAxis(props: {
  /** Left edge and width of the plot, in px from the axis's own left edge. */
  plotLeft: number;
  plotWidth: number;
  currentHour: number;
  cursor: number;
}) {
  const { plotLeft, plotWidth, currentHour, cursor } = props;
  const xPos = (rel: number) => plotLeft + ((rel + HALF_WINDOW) / (HALF_WINDOW * 2)) * plotWidth;
  const clockHour = (rel: number) => (((currentHour + rel) % 24) + 24) % 24;
  const pillLeft = Math.min(Math.max(xPos(cursor), plotLeft + 20), plotLeft + plotWidth - 20);

  return (
    <div className="relative font-mono text-[11px] leading-4" style={{ height: TIME_AXIS_HEIGHT }}>
      {TICKS.map((rel) => (
        <span
          key={rel}
          className={`absolute top-0 transition-opacity ${
            rel === -12 ? "" : rel === 12 ? "-translate-x-full" : "-translate-x-1/2"
          } ${rel === 0 ? "text-neutral-300" : "text-neutral-500"}`}
          style={{ left: xPos(rel), opacity: Math.abs(xPos(rel) - pillLeft) < 34 ? 0 : 1 }}
        >
          {rel === 0 ? "now" : formatHour(clockHour(rel))}
        </span>
      ))}
      <span
        className="absolute top-0 -translate-x-1/2 rounded bg-neutral-100 px-1.5 font-semibold text-neutral-900"
        style={{ left: pillLeft }}
      >
        {cursor === 0 ? "now" : formatHour(clockHour(cursor))}
      </span>
    </div>
  );
}

import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { formatHour } from "./formatHour.ts";

export const TIME_AXIS_HEIGHT = 18;

/** Hours from now at which the clock next or last read `hour`, within the
 * −12h … +12h window (edges included). */
const relsOfClockHour = (currentHour: number, hour: number) =>
  [-24, 0, 24]
    .map((days) => hour - currentHour + days)
    .filter((rel) => rel >= -HALF_WINDOW && rel <= HALF_WINDOW);

/** Where the plots draw a thin vertical line: at 12am and 12pm, so the day's
 * halves read at a glance. Skips now, which has its own dashed line. */
export const clockLineRels = (currentHour: number) =>
  [0, 12]
    .flatMap((hour) => relsOfClockHour(currentHour, hour))
    .filter((rel) => rel > -HALF_WINDOW && rel < HALF_WINDOW && rel !== 0);

/**
 * Clock-hour labels (12am, 6am, 12pm, 6pm) above a −12h … now … +12h plot, so
 * they line up with the 12am and 12pm lines, and a pill that follows the time
 * cursor. The pill reads "now" while the cursor rests; labels it would cover
 * fade out.
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
  const ticks = [0, 6, 12, 18].flatMap((hour) => relsOfClockHour(currentHour, hour));

  return (
    <div className="relative font-mono text-[11px] leading-4" style={{ height: TIME_AXIS_HEIGHT }}>
      {ticks.map((rel) => (
        <span
          key={rel}
          className={`absolute top-0 transition-opacity ${
            rel === -HALF_WINDOW ? "" : rel === HALF_WINDOW ? "-translate-x-full" : "-translate-x-1/2"
          } text-neutral-500`}
          style={{ left: xPos(rel), opacity: Math.abs(xPos(rel) - pillLeft) < 34 ? 0 : 1 }}
        >
          {formatHour(clockHour(rel))}
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

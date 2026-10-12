import { curveMonotoneX, line } from "d3-shape";
import type { DaySeries, HourReading } from "../weather/common.ts";
import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { dayColor } from "./dayColor.ts";
import { useElementWidth } from "./useElementWidth.ts";

/** Space around the plot: the y-axis labels sit in the left inset. */
export const PAD = { top: 4, right: 6, bottom: 4, left: 54 };
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const TICK_FONT = 11;

type RelPoint = { rel: number; value: number };

/**
 * Overlays each day's chosen hourly variable on one shared axis centred on right
 * now (−12h … now … +12h), so every day's curve is aligned by time-of-day and
 * today reads against the days you just lived through. The plotted value is
 * supplied via `value`, so the same chart serves temperature, wind, and rain;
 * several are stacked on one page and share one time cursor, which marks each
 * day's value with a dot. Rendered as hand-built SVG (only d3-shape's curves are borrowed).
 */
export function OverlayChart(props: {
  series: DaySeries[];
  value: (reading: HourReading) => number;
  axisSuffix: string;
  clampZero: boolean;
  currentHour: number;
  hiddenOffsets: Set<number>;
  /** Height of the plot area alone; padding is added. */
  plotHeight: number;
  /** Shared time cursor in hours from now; 0 while it rests at now. */
  cursor: number;
  /** Draw the cursor line (while it is dragged or hovered). */
  scrubbing: boolean;
}) {
  const {
    series,
    value,
    axisSuffix,
    clampZero,
    currentHour,
    hiddenOffsets,
    plotHeight,
    cursor,
    scrubbing,
  } = props;
  const { ref, width } = useElementWidth();

  const visible = series.filter((day) => !hiddenOffsets.has(day.offset));
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const height = plotHeight + PAD.top + PAD.bottom;

  let min = Infinity;
  let max = -Infinity;
  for (const day of visible) {
    for (const reading of day.slots) {
      if (!reading) continue;
      const current = value(reading);
      if (current < min) min = current;
      if (current > max) max = current;
    }
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 20;
  }
  const yMin = clampZero ? Math.max(0, Math.floor(min) - 1) : Math.floor(min) - 1;
  const yMax = Math.max(yMin + 2, Math.ceil(max) + 1);

  const xPos = (rel: number) => PAD.left + ((rel + 12) / 24) * plotWidth;
  const yPos = (reading: number) => PAD.top + (1 - (reading - yMin) / (yMax - yMin)) * plotHeight;
  const plotBottom = PAD.top + plotHeight;

  const buildLine = line<RelPoint>()
    .x((point) => xPos(point.rel))
    .y((point) => yPos(point.value))
    .curve(curveMonotoneX);

  // A day's window is already one continuous run of hours, so each slot maps
  // straight onto the relative axis.
  const toPoints = (day: DaySeries): RelPoint[] =>
    day.slots.flatMap((reading, index) =>
      reading ? [{ rel: index - HALF_WINDOW, value: value(reading) }] : [],
    );

  // Three ticks are enough at these heights; de-duplicate for flat ranges.
  const yTicks = [...new Set([yMin, Math.round((yMin + yMax) / 2), yMax])];

  // Paint order: the farthest days first and today last, so gold is always on top.
  const paintOrder = [...visible].sort((a, b) => Math.abs(b.offset) - Math.abs(a.offset));

  // Where the axis crosses midnight, so the date change is visible on the plot.
  const midnightRel = [-currentHour, 24 - currentHour].find(
    (rel) => rel > -HALF_WINDOW && rel < HALF_WINDOW && rel !== 0,
  );

  const cursorDots = visible.flatMap((day) => {
    const reading = day.slots[cursor + HALF_WINDOW];
    return reading ? [{ day, value: value(reading), style: dayColor(day.offset) }] : [];
  });

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block">
          {/* Same quiet panel as the Days rows, in place of grid lines. */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotWidth}
            height={plotHeight}
            fill="rgba(255,255,255,0.02)"
            rx={4}
          />
          {yTicks.map((tick) => (
            <g key={tick}>
              <text
                x={PAD.left - 4}
                y={yPos(tick)}
                textAnchor="end"
                // The end ticks sit inside the plot, so they never touch the
                // heading above or the chart below.
                dominantBaseline={
                  tick === yMax ? "hanging" : tick === yMin ? "text-after-edge" : "middle"
                }
                fill="#737373"
                fontSize={TICK_FONT}
                fontFamily={MONO}
              >
                {tick}
                {axisSuffix}
              </text>
            </g>
          ))}

          {midnightRel != null && (
            <line
              x1={xPos(midnightRel)}
              x2={xPos(midnightRel)}
              y1={PAD.top}
              y2={plotBottom}
              stroke="#3f3f46"
            />
          )}
          <line
            x1={xPos(0)}
            x2={xPos(0)}
            y1={PAD.top}
            y2={plotBottom}
            stroke="#f5f5f566"
            strokeDasharray="2 3"
          />

          {paintOrder.map((day) => {
            const style = dayColor(day.offset);
            const path = buildLine(toPoints(day));
            if (!path) return null;
            return (
              <path
                key={day.dateKey}
                d={path}
                fill="none"
                stroke={style.color}
                strokeWidth={style.width}
                strokeOpacity={style.opacity}
                strokeDasharray={style.dash}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {scrubbing && (
            <line
              x1={xPos(cursor)}
              x2={xPos(cursor)}
              y1={PAD.top}
              y2={plotBottom}
              stroke="#f8fafc"
              strokeWidth={1.5}
            />
          )}
          {/* Paint order as the lines: today's dot last, on top. */}
          {[...cursorDots]
            .sort((a, b) => Math.abs(b.day.offset) - Math.abs(a.day.offset))
            .map((dot) => (
              <circle
                key={dot.day.dateKey}
                cx={xPos(cursor)}
                cy={yPos(dot.value)}
                r={dot.day.offset === 0 ? 4 : 3}
                fill={dot.style.color}
                stroke="#0e0f11"
                strokeWidth={1.5}
              />
            ))}
        </svg>
      )}
    </div>
  );
}

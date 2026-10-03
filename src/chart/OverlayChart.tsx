import { curveMonotoneX, line } from "d3-shape";
import type { DaySeries, HourReading } from "../weather/common.ts";
import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { dayColor, type DayStyle } from "./dayColor.ts";
import { formatHour } from "./formatHour.ts";
import { useElementWidth } from "./useElementWidth.ts";

const PAD = { top: 8, right: 6, bottom: 4, left: 54 };
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const AXIS_HEIGHT = 16;
const TICK_FONT = 11;
/** Relative-hour ticks, including 0 (the now hour) at centre. */
const X_TICKS = [-12, -6, 0, 6, 12];

type RelPoint = { rel: number; value: number };

/**
 * Overlays each day's chosen hourly variable on one shared axis centred on right
 * now (−12h … now … +12h), so every day's curve is aligned by time-of-day and
 * today reads against the days you just lived through. The plotted value is
 * supplied via `value`, so the same chart serves temperature, wind, and rain;
 * several are stacked on one page and share a hover position. Rendered as hand-built SVG (only d3-shape's curves are borrowed).
 */
export function OverlayChart(props: {
  series: DaySeries[];
  value: (reading: HourReading) => number;
  format: (value: number) => string;
  unitSymbol: string;
  axisSuffix: string;
  clampZero: boolean;
  currentHour: number;
  hiddenOffsets: Set<number>;
  /** Height of the plot area alone; padding and the time axis are added. */
  plotHeight: number;
  /** Draw the clock-hour labels under the plot (the bottom chart only). */
  timeAxis?: boolean;
  /** Shared hover position in hours from now, or null. */
  hoverRel: number | null;
  onHover: (rel: number | null) => void;
  /** Show the tooltip here (the chart under the pointer). */
  showTooltip: boolean;
}) {
  const {
    series,
    value,
    format,
    unitSymbol,
    axisSuffix,
    clampZero,
    currentHour,
    hiddenOffsets,
    plotHeight,
    timeAxis = false,
    hoverRel,
    onHover,
    showTooltip,
  } = props;
  const { ref, width } = useElementWidth();

  const visible = series.filter((day) => !hiddenOffsets.has(day.offset));
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const height = plotHeight + PAD.top + PAD.bottom + (timeAxis ? AXIS_HEIGHT : 0);

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

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (plotWidth <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - PAD.left) / plotWidth;
    const rel = Math.round(ratio * 24 - 12);
    onHover(rel < -12 || rel > 12 ? null : rel);
  };

  // Where the axis crosses midnight, so the date change is visible on the plot.
  const midnightRel = [-currentHour, 24 - currentHour].find(
    (rel) => rel > -HALF_WINDOW && rel < HALF_WINDOW && rel !== 0,
  );

  const hoverClockHour = hoverRel == null ? null : (((currentHour + hoverRel) % 24) + 24) % 24;

  const hoverRows =
    hoverRel == null
      ? []
      : visible
          .map((day) => {
            const reading = day.slots[hoverRel + HALF_WINDOW];
            return {
              day,
              value: reading == null ? null : value(reading),
              style: dayColor(day.offset),
            };
          })
          .filter(
            (row): row is { day: DaySeries; value: number; style: DayStyle } => row.value != null,
          )
          .sort((a, b) => b.day.offset - a.day.offset);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          onPointerMove={onPointerMove}
          onPointerLeave={() => onHover(null)}
          className="touch-none"
        >
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
                dominantBaseline="middle"
                fill="#737373"
                fontSize={TICK_FONT}
                fontFamily={MONO}
              >
                {tick}
                {axisSuffix}
              </text>
            </g>
          ))}

          {timeAxis &&
            X_TICKS.map((rel) => (
              <text
                key={rel}
                x={xPos(rel)}
                y={height - 3}
                textAnchor={rel === -12 ? "start" : rel === 12 ? "end" : "middle"}
                fill={rel === 0 ? "#f8fafc" : "#737373"}
                fontSize={TICK_FONT}
                fontFamily={MONO}
              >
                {rel === 0 ? "now" : formatHour((((currentHour + rel) % 24) + 24) % 24)}
              </text>
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
          {midnightRel != null &&
            timeAxis &&
            X_TICKS.every((tick) => Math.abs(tick - midnightRel) > 3) && (
              <text
                x={xPos(midnightRel)}
                y={height - 3}
                textAnchor="middle"
                fill="#525252"
                fontSize={TICK_FONT}
                fontFamily={MONO}
              >
                12am
              </text>
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

          {hoverRel != null && hoverRows.length > 0 && (
            <>
              <line
                x1={xPos(hoverRel)}
                x2={xPos(hoverRel)}
                y1={PAD.top}
                y2={plotBottom}
                stroke="#f8fafc"
                strokeWidth={1.5}
              />
              {[...hoverRows]
                .sort((a, b) => Math.abs(b.day.offset) - Math.abs(a.day.offset))
                .map((row) => (
                  <circle
                    key={row.day.dateKey}
                    cx={xPos(hoverRel)}
                    cy={yPos(row.value)}
                    r={3.5}
                    fill={row.style.color}
                    fillOpacity={row.style.opacity}
                  />
                ))}
            </>
          )}
        </svg>
      )}

      {showTooltip && hoverRel != null && hoverClockHour != null && hoverRows.length > 0 && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-neutral-900/95 px-2 py-1 text-xs shadow-xl backdrop-blur"
          style={{
            left: Math.min(Math.max(xPos(hoverRel), PAD.left + 50), PAD.left + plotWidth - 50),
          }}
        >
          <div className="mb-0.5 font-mono font-medium text-neutral-300">
            {formatHour(hoverClockHour)}
          </div>
          <div className="space-y-0.5">
            {hoverRows.map((row) => (
              <div key={row.day.dateKey} className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: row.style.color }}
                />
                <span className="w-16 text-neutral-400">{row.day.label}</span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-neutral-100">
                  {format(row.value)}
                  {unitSymbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

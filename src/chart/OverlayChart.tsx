import { useState } from "react";
import { curveMonotoneX, line } from "d3-shape";
import type { DaySeries, HourReading } from "../weather/common.ts";
import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { dayColor, type DayStyle } from "./dayColor.ts";
import { formatHour } from "./formatHour.ts";
import { useElementWidth } from "./useElementWidth.ts";

const HEIGHT = 200;
const PAD = { top: 12, right: 4, bottom: 16, left: 30 };
const TICK_FONT = 10;
/** Relative-hour ticks, including 0 (the now hour) at centre. */
const X_TICKS = [-12, -6, 0, 6, 12];

type RelPoint = { rel: number; value: number };

/**
 * Overlays each day's chosen hourly variable on one shared axis centred on right
 * now (−12h … now … +12h), so every day's curve is aligned by time-of-day and
 * today reads against the days you just lived through. The plotted value is
 * supplied via `value`, so the same chart serves temperature, wind, and rain.
 * Rendered as hand-built SVG (only d3-shape's curve generator is borrowed);
 * tapping a legend chip hides a day, hovering reveals every visible day's value.
 */
export function OverlayChart(props: {
  series: DaySeries[];
  value: (reading: HourReading) => number;
  format: (value: number) => string;
  unitSymbol: string;
  axisSuffix: string;
  clampZero: boolean;
  domain?: [number, number];
  currentHour: number;
  hiddenOffsets: Set<number>;
}) {
  const {
    series,
    value,
    format,
    unitSymbol,
    axisSuffix,
    clampZero,
    domain,
    currentHour,
    hiddenOffsets,
  } = props;
  const { ref, width } = useElementWidth();
  const [hoverRel, setHoverRel] = useState<number | null>(null);

  const visible = series.filter((day) => !hiddenOffsets.has(day.offset));
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

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
  const yMin = domain
    ? domain[0]
    : clampZero
      ? Math.max(0, Math.floor(min) - 2)
      : Math.floor(min) - 2;
  const yMax = domain ? domain[1] : Math.ceil(max) + 2;

  const xPos = (rel: number) => PAD.left + ((rel + 12) / 24) * plotWidth;
  const yPos = (reading: number) =>
    PAD.top + (1 - (reading - yMin) / (yMax - yMin)) * plotHeight;

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

  // De-duplicate so a small range (e.g. a flat 0% rain day) can't repeat a tick.
  const yTicks = [
    ...new Set(
      Array.from({ length: 5 }, (_, index) =>
        Math.round(yMin + ((yMax - yMin) / 4) * index),
      ),
    ),
  ];

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (plotWidth <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - PAD.left) / plotWidth;
    const rel = Math.round(ratio * 24 - 12);
    setHoverRel(rel < -12 || rel > 12 ? null : rel);
  };

  // Where the axis crosses midnight, so the date change is visible on the plot.
  const midnightRel = [-currentHour, 24 - currentHour].find(
    (rel) => rel > -HALF_WINDOW && rel < HALF_WINDOW && rel !== 0,
  );

  const hoverClockHour =
    hoverRel == null ? null : (((currentHour + hoverRel) % 24) + 24) % 24;

  const hoverRows =
    hoverClockHour == null
      ? []
      : visible
          .map((day) => {
            const reading = day.slots[(hoverRel ?? 0) + HALF_WINDOW];
            return {
              day,
              value: reading == null ? null : value(reading),
              style: dayColor(day.offset),
            };
          })
          .filter(
            (row): row is { day: DaySeries; value: number; style: DayStyle } =>
              row.value != null,
          )
          .sort((a, b) => b.day.offset - a.day.offset);

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHoverRel(null)}
            className="touch-none"
          >
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={yPos(tick)}
                  y2={yPos(tick)}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={PAD.left - 4}
                  y={yPos(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#64748b"
                  fontSize={TICK_FONT}
                >
                  {tick}
                  {axisSuffix}
                </text>
              </g>
            ))}

            {X_TICKS.map((rel) => (
              <text
                key={rel}
                x={xPos(rel)}
                y={HEIGHT - 3}
                textAnchor={rel === -12 ? "start" : rel === 12 ? "end" : "middle"}
                fill="#64748b"
                fontSize={TICK_FONT}
              >
                {formatHour((((currentHour + rel) % 24) + 24) % 24)}
              </text>
            ))}

            {midnightRel != null && (
              <g>
                <line
                  x1={xPos(midnightRel)}
                  x2={xPos(midnightRel)}
                  y1={PAD.top}
                  y2={PAD.top + plotHeight}
                  stroke="#334155"
                />
                <text
                  x={xPos(midnightRel) + (midnightRel > 0 ? -3 : 3)}
                  y={PAD.top + plotHeight - 3}
                  textAnchor={midnightRel > 0 ? "end" : "start"}
                  fill="#475569"
                  fontSize={TICK_FONT}
                >
                  midnight
                </text>
              </g>
            )}

            <line
              x1={xPos(0)}
              x2={xPos(0)}
              y1={PAD.top}
              y2={PAD.top + plotHeight}
              stroke="#f8fafc99"
              strokeDasharray="4 4"
            />
            <text
              x={xPos(0)}
              y={PAD.top - 3}
              textAnchor="middle"
              fill="#f8fafc"
              fontSize={TICK_FONT}
            >
              now
            </text>

            {visible.map((day) => {
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
                  y2={PAD.top + plotHeight}
                  stroke="#475569"
                />
                {hoverRows.map((row) => (
                  <circle
                    key={row.day.dateKey}
                    cx={xPos(hoverRel)}
                    cy={yPos(row.value)}
                    r={3}
                    fill={row.style.color}
                    fillOpacity={row.style.opacity}
                  />
                ))}
              </>
            )}
          </svg>
        )}

        {hoverRel != null && hoverClockHour != null && hoverRows.length > 0 && (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900/95 px-2 py-1 text-xs shadow-xl backdrop-blur"
            style={{
              left: Math.min(
                Math.max(xPos(hoverRel), PAD.left + 55),
                width - PAD.right - 55,
              ),
            }}
          >
            <div className="mb-0.5 font-medium text-slate-300">
              {formatHour(hoverClockHour)}
            </div>
            <div className="space-y-0.5">
              {hoverRows.map((row) => (
                <div key={row.day.dateKey} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: row.style.color }}
                  />
                  <span className="w-8 text-slate-400">{row.day.label}</span>
                  <span className="whitespace-nowrap font-semibold tabular-nums text-slate-100">
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

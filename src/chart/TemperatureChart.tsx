import { useState } from "react";
import { curveMonotoneX, line } from "d3-shape";
import type { DaySeries, Metric } from "../weather/common.ts";
import { dayColor, type DayStyle } from "./dayColor.ts";
import { formatHour } from "./formatHour.ts";
import { useElementWidth } from "./useElementWidth.ts";

const HEIGHT = 300;
const PAD = { top: 16, right: 12, bottom: 28, left: 40 };
/** Relative-hour gridlines; "now" (0) is drawn separately as the centre marker. */
const X_TICKS = [-12, -6, 6, 12];

/** Signed hours from now (−12…+12) for a clock hour, given the centre hour.
 * Both edges (−12 and +12) map to the same clock hour, half a day from now. */
const toRel = (hour: number, center: number) =>
  ((((hour - center + 12) % 24) + 24) % 24) - 12;

type RelPoint = { rel: number; value: number };

/**
 * Overlays each day's hourly temperatures on one shared axis centred on right
 * now (−12h … now … +12h), so every day's curve is aligned by time-of-day and
 * today reads against the days you just lived through. Rendered as hand-built
 * SVG (only d3-shape's curve generator is borrowed); tapping a legend chip hides
 * a day, and hovering reveals every visible day's value at that hour.
 */
export function TemperatureChart(props: {
  series: DaySeries[];
  metric: Metric;
  unitSymbol: string;
  currentHour: number;
  hiddenDays: Set<string>;
  onToggleDay: (dateKey: string) => void;
}) {
  const { series, metric, unitSymbol, currentHour, hiddenDays, onToggleDay } =
    props;
  const { ref, width } = useElementWidth();
  const [hoverRel, setHoverRel] = useState<number | null>(null);

  const visible = series.filter((day) => !hiddenDays.has(day.dateKey));
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  let min = Infinity;
  let max = -Infinity;
  for (const day of visible) {
    for (const reading of day.readings) {
      if (reading[metric] < min) min = reading[metric];
      if (reading[metric] > max) max = reading[metric];
    }
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 20;
  }
  const yMin = Math.floor(min) - 2;
  const yMax = Math.ceil(max) + 2;

  const xPos = (rel: number) => PAD.left + ((rel + 12) / 24) * plotWidth;
  const yPos = (value: number) =>
    PAD.top + (1 - (value - yMin) / (yMax - yMin)) * plotHeight;

  const buildLine = line<RelPoint>()
    .x((point) => xPos(point.rel))
    .y((point) => yPos(point.value))
    .curve(curveMonotoneX);

  // Re-anchor a day's readings to the relative axis, duplicating the half-day
  // edge so the curve spans the full width symmetrically.
  const toPoints = (day: DaySeries): RelPoint[] => {
    const points = day.readings.map((reading) => ({
      rel: toRel(reading.hour, currentHour),
      value: reading[metric],
    }));
    const edge = points.find((point) => point.rel === -12);
    if (edge) points.push({ rel: 12, value: edge.value });
    return points.sort((a, b) => a.rel - b.rel);
  };

  const yTicks = Array.from({ length: 5 }, (_, index) =>
    Math.round(yMin + ((yMax - yMin) / 4) * index),
  );

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (plotWidth <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - PAD.left) / plotWidth;
    const rel = Math.round(ratio * 24 - 12);
    setHoverRel(rel < -12 || rel > 12 ? null : rel);
  };

  const hoverClockHour =
    hoverRel == null ? null : (((currentHour + hoverRel) % 24) + 24) % 24;

  const hoverRows =
    hoverClockHour == null
      ? []
      : visible
          .map((day) => ({
            day,
            value: day.readings.find(
              (reading) => reading.hour === hoverClockHour,
            )?.[metric],
            style: dayColor(day.offset),
          }))
          .filter(
            (row): row is { day: DaySeries; value: number; style: DayStyle } =>
              row.value != null,
          )
          .sort((a, b) => b.day.offset - a.day.offset);

  return (
    <div className="flex flex-col gap-3">
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
                  x={PAD.left - 8}
                  y={yPos(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#64748b"
                  fontSize={12}
                >
                  {tick}
                  {unitSymbol}
                </text>
              </g>
            ))}

            {X_TICKS.map((rel) => (
              <text
                key={rel}
                x={xPos(rel)}
                y={HEIGHT - 8}
                textAnchor={rel === -12 ? "start" : rel === 12 ? "end" : "middle"}
                fill="#64748b"
                fontSize={12}
              >
                {formatHour((((currentHour + rel) % 24) + 24) % 24)}
              </text>
            ))}

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
              y={PAD.top - 4}
              textAnchor="middle"
              fill="#f8fafc"
              fontSize={11}
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
                    r={4}
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
            className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-sm shadow-xl backdrop-blur"
            style={{
              left: Math.min(
                Math.max(xPos(hoverRel), PAD.left + 70),
                width - PAD.right - 70,
              ),
            }}
          >
            <div className="mb-1 font-medium text-slate-300">
              {formatHour(hoverClockHour)}
            </div>
            <div className="space-y-1">
              {hoverRows.map((row) => (
                <div key={row.day.dateKey} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: row.style.color }}
                  />
                  <span className="w-20 text-slate-400">{row.day.label}</span>
                  <span className="font-semibold tabular-nums text-slate-100">
                    {Math.round(row.value)}
                    {unitSymbol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {series.map((day) => {
          const style = dayColor(day.offset);
          const hidden = hiddenDays.has(day.dateKey);
          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => onToggleDay(day.dateKey)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                hidden
                  ? "border-white/5 bg-transparent text-slate-500"
                  : "border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
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
    </div>
  );
}

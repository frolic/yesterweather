import { area, curveMonotoneX, line } from "d3-shape";
import type { DaySeries, HourReading } from "../weather/common.ts";
import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { dayColor, type DayStyle } from "./dayColor.ts";
import { formatHour } from "./formatHour.ts";
import { useElementWidth } from "./useElementWidth.ts";

/** Right gutter holds the chart title and each day's value at "now". */
const PAD = { top: 12, right: 50, bottom: 4, left: 28 };
const AXIS_HEIGHT = 14;
const TICK_FONT = 10;
/** Relative-hour ticks, including 0 (the now hour) at centre. */
const X_TICKS = [-12, -6, 0, 6, 12];

type RelPoint = { rel: number; value: number };
type Pair = { rel: number; today: number; yesterday: number };

/**
 * Overlays each day's chosen hourly variable on one shared axis centred on right
 * now (−12h … now … +12h), so every day's curve is aligned by time-of-day and
 * today reads against the days you just lived through. The plotted value is
 * supplied via `value`, so the same chart serves temperature, wind, and rain;
 * several are stacked on one page and share a hover position. The right gutter
 * labels each visible day's value at now. With `diffFill`, the gap between
 * today and yesterday is shaded red where today is warmer and blue where it is
 * colder. Rendered as hand-built SVG (only d3-shape's curves are borrowed).
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
  title: string;
  height: number;
  /** Draw the clock-hour labels under the plot (the bottom chart only). */
  timeAxis?: boolean;
  diffFill?: boolean;
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
    title,
    height,
    timeAxis = false,
    diffFill = false,
    hoverRel,
    onHover,
    showTooltip,
  } = props;
  const { ref, width } = useElementWidth();

  const visible = series.filter((day) => !hiddenOffsets.has(day.offset));
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight =
    height - PAD.top - PAD.bottom - (timeAxis ? AXIS_HEIGHT : 0);

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
  const yPos = (reading: number) =>
    PAD.top + (1 - (reading - yMin) / (yMax - yMin)) * plotHeight;
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

  const today = visible.find((day) => day.offset === 0);
  const yesterday = visible.find((day) => day.offset === -1);
  const pairs: Pair[] =
    diffFill && today && yesterday
      ? today.slots.flatMap((reading, index) => {
          const other = yesterday.slots[index];
          return reading && other
            ? [
                {
                  rel: index - HALF_WINDOW,
                  today: value(reading),
                  yesterday: value(other),
                },
              ]
            : [];
        })
      : [];
  const pairArea = (y0: (pair: Pair) => number) =>
    area<Pair>()
      .x((pair) => xPos(pair.rel))
      .y0(y0)
      .y1((pair) => yPos(pair.today))
      .curve(curveMonotoneX)(pairs);
  const clipArea = (edge: number) =>
    area<Pair>()
      .x((pair) => xPos(pair.rel))
      .y0(edge)
      .y1((pair) => yPos(pair.yesterday))
      .curve(curveMonotoneX)(pairs);
  const between = pairs.length ? pairArea((pair) => yPos(pair.yesterday)) : null;
  const clipId = `diff-${title.replace(/\W/g, "")}`;

  // Three ticks are enough at these heights; de-duplicate for flat ranges.
  const yTicks = [
    ...new Set([yMin, Math.round((yMin + yMax) / 2), yMax]),
  ];

  // Gutter labels at "now", nudged apart so they never overlap.
  const labels = visible
    .flatMap((day) => {
      const reading = day.slots[HALF_WINDOW];
      return reading
        ? [{ day, value: value(reading), y: yPos(value(reading)) }]
        : [];
    })
    .sort((a, b) => a.y - b.y);
  // Keep the first label clear of the title.
  for (let index = 0; index < labels.length; index += 1) {
    const floor = index === 0 ? PAD.top + 8 : labels[index - 1].y + 11;
    labels[index].y = Math.max(labels[index].y, floor);
  }

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

  const hoverClockHour =
    hoverRel == null ? null : (((currentHour + hoverRel) % 24) + 24) % 24;

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
            (row): row is { day: DaySeries; value: number; style: DayStyle } =>
              row.value != null,
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
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotWidth}
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

          {timeAxis &&
            X_TICKS.map((rel) => (
              <text
                key={rel}
                x={xPos(rel)}
                y={height - 3}
                textAnchor={rel === -12 ? "start" : rel === 12 ? "end" : "middle"}
                fill={rel === 0 ? "#f8fafc" : "#64748b"}
                fontSize={TICK_FONT}
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
              stroke="#334155"
            />
          )}
          {midnightRel != null &&
            timeAxis &&
            X_TICKS.every((tick) => Math.abs(tick - midnightRel) > 3) && (
            <text
              x={xPos(midnightRel)}
              y={height - 3}
              textAnchor="middle"
              fill="#475569"
              fontSize={TICK_FONT}
            >
              12am
            </text>
          )}

          <line
            x1={xPos(0)}
            x2={xPos(0)}
            y1={PAD.top}
            y2={plotBottom}
            stroke="#f8fafc99"
            strokeDasharray="4 4"
          />

          {between && (
            <g>
              <defs>
                <clipPath id={`${clipId}-warm`}>
                  <path d={clipArea(PAD.top) ?? ""} />
                </clipPath>
                <clipPath id={`${clipId}-cold`}>
                  <path d={clipArea(plotBottom) ?? ""} />
                </clipPath>
              </defs>
              <path
                d={between}
                fill="#ef4444"
                fillOpacity={0.3}
                clipPath={`url(#${clipId}-warm)`}
              />
              <path
                d={between}
                fill="#3b82f6"
                fillOpacity={0.3}
                clipPath={`url(#${clipId}-cold)`}
              />
            </g>
          )}

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

          <text
            x={width - PAD.right + 4}
            y={PAD.top - 3}
            fontSize={TICK_FONT}
            fontWeight={600}
            fill="#94a3b8"
          >
            {title}
          </text>
          {labels.map((label) => {
            const style = dayColor(label.day.offset);
            return (
              <text
                key={label.day.dateKey}
                x={width - PAD.right + 4}
                y={label.y}
                dominantBaseline="middle"
                fontSize={TICK_FONT}
                fill={style.color}
                fontWeight={label.day.offset === 0 ? 700 : 500}
                className="tabular-nums"
              >
                {label.day.label} {format(label.value)}
              </text>
            );
          })}

          {hoverRel != null && hoverRows.length > 0 && (
            <>
              <line
                x1={xPos(hoverRel)}
                x2={xPos(hoverRel)}
                y1={PAD.top}
                y2={plotBottom}
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

      {showTooltip &&
        hoverRel != null &&
        hoverClockHour != null &&
        hoverRows.length > 0 && (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900/95 px-2 py-1 text-xs shadow-xl backdrop-blur"
            style={{
              left: Math.min(
                Math.max(xPos(hoverRel), PAD.left + 50),
                PAD.left + plotWidth - 50,
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

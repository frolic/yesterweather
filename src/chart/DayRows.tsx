import { useRef, useState } from "react";
import { curveMonotoneX, line } from "d3-shape";
import type { DaySeries, HourReading, Metric } from "../weather/common.ts";
import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { dayColor } from "./dayColor.ts";
import { formatHour } from "./formatHour.ts";
import { useElementWidth } from "./useElementWidth.ts";

const LABEL_WIDTH = 34;
const VALUE_WIDTH = 92;
const GAP = 6;
const ROW_HEIGHT = 46;
const AXIS_HEIGHT = 18;
/** Row inset so the line never touches the row edges. */
const INSET = 6;
const X_TICKS = [-12, -6, 0, 6, 12];

const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value)}°`;
const tone = (value: number) =>
  value > 0 ? "text-amber-300" : value < 0 ? "text-sky-300" : "text-slate-400";

/**
 * One row per day on a shared −12h … now … +12h axis. Each row draws that
 * day's temperature line (today's line sits faintly behind it for comparison)
 * and its hourly rain as bars. A time cursor runs through every row: it starts
 * at now and can be dragged (or hovered, with a mouse) to any hour, and each
 * row's right-hand column shows that day's temperature, change vs today, wind
 * and rain at the cursor. All rows share one temperature scale.
 */
export function DayRows(props: {
  series: DaySeries[];
  metric: Metric;
  currentHour: number;
  windUnit: string;
}) {
  const { series, metric, currentHour, windUnit } = props;
  const { ref, width } = useElementWidth();
  const [cursor, setCursor] = useState(0);
  const dragging = useRef(false);

  const sparkLeft = LABEL_WIDTH + GAP;
  const sparkWidth = Math.max(0, width - sparkLeft - VALUE_WIDTH - GAP);
  const xPos = (rel: number) =>
    sparkLeft + ((rel + HALF_WINDOW) / (HALF_WINDOW * 2)) * sparkWidth;

  const readings = series.flatMap(
    (day) => day.slots.filter(Boolean) as HourReading[],
  );
  const values = readings.map((reading) => reading[metric]);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const maxRain = Math.max(2, ...readings.map((r) => r.precipitation));
  const yPos = (value: number) =>
    INSET + (1 - (value - min) / (max - min || 1)) * (ROW_HEIGHT - INSET * 2);

  const buildLine = line<{ rel: number; value: number }>()
    .x((point) => xPos(point.rel))
    .y((point) => yPos(point.value))
    .curve(curveMonotoneX);
  const pathOf = (day: DaySeries) =>
    buildLine(
      day.slots.flatMap((reading, index) =>
        reading ? [{ rel: index - HALF_WINDOW, value: reading[metric] }] : [],
      ),
    ) ?? "";

  const today = series.find((day) => day.offset === 0);
  const todayPath = today ? pathOf(today) : "";
  const todayAtCursor = today?.slots[cursor + HALF_WINDOW]?.[metric];

  const midnightRel = [-currentHour, 24 - currentHour].find(
    (rel) => rel > -HALF_WINDOW && rel < HALF_WINDOW && rel !== 0,
  );
  const clockHour = (rel: number) => (((currentHour + rel) % 24) + 24) % 24;

  const moveTo = (event: React.PointerEvent<HTMLDivElement>) => {
    if (sparkWidth <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - sparkLeft) / sparkWidth;
    const rel = Math.round(ratio * HALF_WINDOW * 2 - HALF_WINDOW);
    setCursor(Math.max(-HALF_WINDOW, Math.min(HALF_WINDOW, rel)));
  };

  const rowsHeight = series.length * ROW_HEIGHT;

  return (
    <div
      ref={ref}
      className="relative select-none"
      style={{ height: AXIS_HEIGHT + rowsHeight, touchAction: "pan-y" }}
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        moveTo(event);
      }}
      onPointerMove={(event) => {
        if (dragging.current || event.pointerType === "mouse") moveTo(event);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      onDoubleClick={() => setCursor(0)}
    >
      {width > 0 && (
        <>
          <svg
            width={width}
            height={AXIS_HEIGHT + rowsHeight}
            className="absolute inset-0"
          >
            {X_TICKS.map((rel) => (
              <text
                key={rel}
                x={xPos(rel)}
                y={AXIS_HEIGHT - 6}
                textAnchor={rel === -12 ? "start" : rel === 12 ? "end" : "middle"}
                fill={rel === 0 ? "#f8fafc" : "#64748b"}
                fontSize={10}
                opacity={Math.abs(rel - cursor) < 3 ? 0 : 1}
              >
                {rel === 0 ? "now" : formatHour(clockHour(rel))}
              </text>
            ))}

            {series.map((day, index) => {
              const style = dayColor(day.offset);
              const top = AXIS_HEIGHT + index * ROW_HEIGHT;
              const isToday = day.offset === 0;
              return (
                <g key={day.dateKey} transform={`translate(0 ${top})`}>
                  <rect
                    x={sparkLeft}
                    width={sparkWidth}
                    height={ROW_HEIGHT - 2}
                    fill={isToday ? "rgba(250,204,21,0.05)" : "rgba(255,255,255,0.02)"}
                    rx={4}
                  />
                  {midnightRel != null && (
                    <line
                      x1={xPos(midnightRel)}
                      x2={xPos(midnightRel)}
                      y2={ROW_HEIGHT - 2}
                      stroke="#334155"
                    />
                  )}
                  <line
                    x1={xPos(0)}
                    x2={xPos(0)}
                    y2={ROW_HEIGHT - 2}
                    stroke="#f8fafc55"
                    strokeDasharray="3 3"
                  />
                  {day.slots.map((reading, slot) =>
                    reading && reading.precipitation > 0 ? (
                      <rect
                        key={slot}
                        x={xPos(slot - HALF_WINDOW) - sparkWidth / 60}
                        width={sparkWidth / 30}
                        y={ROW_HEIGHT - 2 - (reading.precipitation / maxRain) * (ROW_HEIGHT * 0.45)}
                        height={(reading.precipitation / maxRain) * (ROW_HEIGHT * 0.45)}
                        fill="#7dd3fc"
                        fillOpacity={0.45}
                      />
                    ) : null,
                  )}
                  {!isToday && todayPath && (
                    <path
                      d={todayPath}
                      fill="none"
                      stroke={dayColor(0).color}
                      strokeOpacity={0.25}
                      strokeWidth={1.5}
                    />
                  )}
                  <path
                    d={pathOf(day)}
                    fill="none"
                    stroke={style.color}
                    strokeWidth={isToday ? 2.5 : 2}
                    strokeLinecap="round"
                  />
                  {day.slots[cursor + HALF_WINDOW] && (
                    <circle
                      cx={xPos(cursor)}
                      cy={yPos(day.slots[cursor + HALF_WINDOW]![metric])}
                      r={3}
                      fill={style.color}
                    />
                  )}
                </g>
              );
            })}

            <line
              x1={xPos(cursor)}
              x2={xPos(cursor)}
              y1={AXIS_HEIGHT - 2}
              y2={AXIS_HEIGHT + rowsHeight}
              stroke="#f8fafc"
              strokeWidth={1.5}
            />
          </svg>

          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded bg-white px-1 text-[10px] font-semibold leading-[14px] text-slate-900"
            style={{
              left: Math.min(Math.max(xPos(cursor), sparkLeft + 18), sparkLeft + sparkWidth - 18),
            }}
          >
            {cursor === 0 ? "now" : formatHour(clockHour(cursor))}
          </div>

          {series.map((day, index) => {
            const style = dayColor(day.offset);
            const reading = day.slots[cursor + HALF_WINDOW];
            const delta =
              reading && todayAtCursor != null && day.offset !== 0
                ? Math.round(reading[metric] - todayAtCursor)
                : null;
            return (
              <div
                key={day.dateKey}
                className="pointer-events-none absolute left-0 right-0 flex items-center"
                style={{ top: AXIS_HEIGHT + index * ROW_HEIGHT, height: ROW_HEIGHT - 2 }}
              >
                <span
                  className={`text-xs ${day.offset === 0 ? "font-semibold" : "font-medium"}`}
                  style={{ width: LABEL_WIDTH, color: style.color }}
                >
                  {day.label}
                </span>
                <span
                  className="ml-auto flex flex-col items-end tabular-nums"
                  style={{ width: VALUE_WIDTH }}
                >
                  {reading ? (
                    <>
                      <span className="text-sm font-semibold leading-tight text-slate-100">
                        {Math.round(reading[metric])}°
                        {delta != null && (
                          <span className={`ml-1 text-[10px] font-medium ${tone(delta)}`}>
                            {signed(delta)}
                          </span>
                        )}
                      </span>
                      <span className="whitespace-nowrap text-[10px] leading-tight text-slate-400">
                        {Math.round(reading.windSpeed)} {windUnit}
                        {reading.precipitation > 0 && (
                          <span className="text-sky-300">
                            {" "}· {reading.precipitation.toFixed(1)}mm
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-600">–</span>
                  )}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

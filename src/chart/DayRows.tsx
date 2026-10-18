import { curveMonotoneX, line } from "d3-shape";
import type { DaySeries, Metric } from "../weather/common.ts";
import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { dayColor } from "./dayColor.ts";
import { clockLineRels, TIME_AXIS_HEIGHT, TimeAxis } from "./TimeAxis.tsx";
import { useElementWidth } from "./useElementWidth.ts";
import { useScrub } from "./useScrub.ts";

const LABEL_WIDTH = 40;
const VALUE_WIDTH = 64;
const GAP = 6;
const ROW_HEIGHT = 80;
const ROW_GAP = 12;
const ROW_PITCH = ROW_HEIGHT + ROW_GAP;
const AXIS_HEIGHT = TIME_AXIS_HEIGHT + 4;
/** Row inset so the line never touches the row edges. */
const INSET = 8;

const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value)}°`;
const tone = (value: number) =>
  value > 0 ? "text-red-400" : value < 0 ? "text-blue-400" : "text-neutral-400";

/**
 * One row per day on a shared −12h … now … +12h axis. Each row draws that
 * day's temperature line (today's line sits faintly behind it for comparison)
 * and its hourly rain as bars. A time cursor runs through every row: it rests
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
  const sparkLeft = LABEL_WIDTH + GAP;
  const sparkWidth = Math.max(0, width - sparkLeft - VALUE_WIDTH - GAP);
  const { cursor, active, handlers, style: scrubStyle } = useScrub({ left: sparkLeft, width: sparkWidth });
  const xPos = (rel: number) => sparkLeft + ((rel + HALF_WINDOW) / (HALF_WINDOW * 2)) * sparkWidth;

  const readings = series.flatMap((day) => day.slots.flatMap((slot) => (slot ? [slot] : [])));
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

  const clockLines = clockLineRels(currentHour);
  const rowsHeight = series.length * ROW_PITCH - ROW_GAP;

  return (
    <div
      ref={ref}
      className="relative"
      style={{ ...scrubStyle, height: AXIS_HEIGHT + rowsHeight }}
      {...handlers}
    >
      {width > 0 && (
        <>
          <svg width={width} height={AXIS_HEIGHT + rowsHeight} className="absolute inset-0">
            {series.map((day, index) => {
              const style = dayColor(day.offset);
              const top = AXIS_HEIGHT + index * ROW_PITCH;
              const isToday = day.offset === 0;
              return (
                <g key={day.dateKey} transform={`translate(0 ${top})`}>
                  <rect
                    x={sparkLeft}
                    width={sparkWidth}
                    height={ROW_HEIGHT}
                    fill={isToday ? "rgba(220,181,79,0.07)" : "rgba(255,255,255,0.02)"}
                    rx={4}
                  />
                  {clockLines.map((rel) => (
                    <line
                      key={rel}
                      x1={xPos(rel)}
                      x2={xPos(rel)}
                      y2={ROW_HEIGHT}
                      stroke="#3f3f46"
                    />
                  ))}
                  <line
                    x1={xPos(0)}
                    x2={xPos(0)}
                    y2={ROW_HEIGHT}
                    stroke="#f8fafc55"
                    strokeDasharray="3 3"
                  />
                  {day.slots.map((reading, slot) =>
                    reading && reading.precipitation > 0 ? (
                      <rect
                        key={slot}
                        x={xPos(slot - HALF_WINDOW) - sparkWidth / 60}
                        width={sparkWidth / 30}
                        y={ROW_HEIGHT - (reading.precipitation / maxRain) * (ROW_HEIGHT * 0.45)}
                        height={(reading.precipitation / maxRain) * (ROW_HEIGHT * 0.45)}
                        fill="#60a5fa"
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
                    strokeDasharray={style.dash}
                    strokeLinecap="round"
                  />
                  {day.slots[cursor + HALF_WINDOW] && (
                    <circle
                      cx={xPos(cursor)}
                      cy={yPos(day.slots[cursor + HALF_WINDOW]![metric])}
                      r={3.5}
                      fill={style.color}
                    />
                  )}
                </g>
              );
            })}

            {active && (
              <line
                x1={xPos(cursor)}
                x2={xPos(cursor)}
                y1={AXIS_HEIGHT}
                y2={AXIS_HEIGHT + rowsHeight}
                stroke="#f8fafc"
                strokeWidth={1.5}
              />
            )}
          </svg>

          <div className="absolute inset-x-0 top-0">
            <TimeAxis
              plotLeft={sparkLeft}
              plotWidth={sparkWidth}
              currentHour={currentHour}
              cursor={cursor}
            />
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
                style={{ top: AXIS_HEIGHT + index * ROW_PITCH, height: ROW_HEIGHT }}
              >
                <span
                  className={`text-sm ${day.offset === 0 ? "font-semibold" : "font-medium"}`}
                  style={{ width: LABEL_WIDTH, color: style.text }}
                >
                  {day.label}
                </span>
                <span
                  className="ml-auto flex flex-col items-end tabular-nums"
                  style={{ width: VALUE_WIDTH }}
                >
                  {reading ? (
                    <>
                      <span className="text-base font-semibold leading-tight text-neutral-100">
                        {Math.round(reading[metric])}°
                        {delta != null && (
                          <span className={`ml-1 text-xs font-medium ${tone(delta)}`}>
                            {signed(delta)}
                          </span>
                        )}
                      </span>
                      <span className="whitespace-nowrap text-xs leading-tight text-neutral-400">
                        {Math.round(reading.windSpeed)} {windUnit}
                      </span>
                      {reading.precipitation > 0 && (
                        <span className="whitespace-nowrap text-xs leading-tight text-sky-300">
                          {reading.precipitation.toFixed(1)} mm
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-neutral-600">–</span>
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

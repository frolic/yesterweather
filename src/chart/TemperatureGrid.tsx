import { Fragment, useMemo } from "react";
import type { DaySeries, Metric } from "../weather/common.ts";
import { buildDiffGrid } from "./diffGrid.ts";
import { formatHour } from "./formatHour.ts";

/** Diverging blue→red background for a delta, scaled against the grid's max. */
const cellBackground = (delta: number, maxAbs: number) => {
  if (delta === 0) return "transparent";
  const intensity = 0.15 + Math.min(1, Math.abs(delta) / maxAbs) * 0.6;
  return delta > 0
    ? `rgba(239, 68, 68, ${intensity})`
    : `rgba(59, 130, 246, ${intensity})`;
};

const NOW_RING = "rgba(255, 255, 255, 0.3)";

/** Inset edge lines that form a single outline around the "now" row: top and
 * bottom on every cell, plus left/right only on the first/last so there are no
 * internal dividers. */
const nowRowRing = (columnIndex: number, count: number) =>
  [
    `inset 0 1px 0 ${NOW_RING}`,
    `inset 0 -1px 0 ${NOW_RING}`,
    columnIndex === 0 ? `inset 1px 0 0 ${NOW_RING}` : "",
    columnIndex === count - 1 ? `inset -1px 0 0 ${NOW_RING}` : "",
  ]
    .filter(Boolean)
    .join(", ");

/**
 * Hours × days matrix of temperatures. Each cell shows the temperature, shaded
 * by how it compares to today at the same hour, with a blue bar along its
 * bottom for that hour's rain. Scan a column for one day's arc, a row to
 * compare that hour across days. The header row carries each column's high and
 * low; a rule marks where the rows cross midnight. Today is the neutral
 * baseline column and the "now" row is outlined.
 */
export function TemperatureGrid(props: {
  series: DaySeries[];
  metric: Metric;
  currentHour: number;
}) {
  const grid = useMemo(
    () => buildDiffGrid(props.series, props.metric, props.currentHour),
    [props.series, props.metric, props.currentHour],
  );
  if (!grid) return null;
  const { days, rows, maxAbs, maxRain } = grid;
  const todayLabel = days.find((day) => day.offset === 0)?.label ?? "today";

  const extremes = days.map((_, columnIndex) => {
    const values = rows
      .map((row) => row.cells[columnIndex].value)
      .filter((value): value is number => value != null);
    return values.length
      ? { high: Math.max(...values), low: Math.min(...values) }
      : null;
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="overflow-hidden rounded-lg border border-white/5">
        <div
          className="grid text-center text-[11px] leading-none"
          style={{ gridTemplateColumns: `36px repeat(${days.length}, 1fr)` }}
        >
          <div className="bg-slate-900/95" />
          {days.map((day, columnIndex) => (
            <div
              key={day.dateKey}
              className="bg-slate-900/95 py-1 tabular-nums"
            >
              <div
                className={`font-medium ${
                  day.offset === 0 ? "text-amber-300" : "text-slate-300"
                }`}
              >
                {day.label}
              </div>
              {extremes[columnIndex] && (
                <div className="mt-0.5 text-[10px] text-slate-500">
                  {extremes[columnIndex].high}°/{extremes[columnIndex].low}°
                </div>
              )}
            </div>
          ))}

          {rows.map((row) => {
            const isNow = row.rel === 0;
            const divider = row.startsDay ? "border-t border-slate-500/60" : "";
            return (
              <Fragment key={row.rel}>
                <div
                  className={`py-1 pr-1 text-right tabular-nums ${divider} ${
                    isNow ? "font-semibold text-white" : "text-slate-500"
                  }`}
                >
                  {isNow ? "now" : formatHour(row.hour)}
                </div>
                {row.cells.map((cell, columnIndex) => (
                  <div
                    key={cell.dateKey}
                    className={`relative py-1 tabular-nums ${divider} ${
                      isNow ? "font-medium text-white" : "text-slate-100"
                    }`}
                    style={{
                      backgroundColor: cell.isToday
                        ? "rgba(255,255,255,0.04)"
                        : cell.delta == null
                          ? "transparent"
                          : cellBackground(cell.delta, maxAbs),
                      boxShadow: isNow
                        ? nowRowRing(columnIndex, row.cells.length)
                        : undefined,
                    }}
                  >
                    {cell.value == null ? "" : `${cell.value}°`}
                    {cell.precipitation > 0 && maxRain > 0 && (
                      <span
                        className="absolute bottom-0 left-0 h-0.5 bg-sky-300"
                        style={{
                          width: `${Math.max(15, (cell.precipitation / maxRain) * 100)}%`,
                        }}
                        title={`${cell.precipitation.toFixed(1)} mm`}
                      />
                    )}
                  </div>
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-1.5 text-[10px] text-slate-500">
        <span>colder</span>
        <span
          className="h-1.5 w-12 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.8), rgba(148,163,184,0.15), rgba(239,68,68,0.8))",
          }}
        />
        <span>warmer vs {todayLabel}, same hour</span>
        <span className="ml-1 inline-block h-0.5 w-3 bg-sky-300" />
        <span>rain</span>
      </div>
    </div>
  );
}

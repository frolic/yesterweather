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
 * Hours × days matrix of temperatures. Each cell shows the actual temperature,
 * shaded by how it compares to today at the same hour — scan a column for one
 * day's arc, a row to compare that hour across days. Today is the neutral
 * baseline column; the "now" row is highlighted and scrolled into view on mount.
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
  const { days, rows, maxAbs } = grid;
  const todayLabel = days.find((day) => day.offset === 0)?.label ?? "today";

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-white/5">
        <div
          className="grid text-center text-xs"
          style={{ gridTemplateColumns: `44px repeat(${days.length}, 1fr)` }}
        >
          <div className="bg-slate-900/95 py-2" />
          {days.map((day) => (
            <div
              key={day.dateKey}
              className={`bg-slate-900/95 py-2 font-medium ${
                day.offset === 0 ? "text-amber-300" : "text-slate-300"
              }`}
            >
              {day.label}
            </div>
          ))}

          {rows.map((row) => {
            const isNow = row.hour === props.currentHour;
            return (
              <Fragment key={row.hour}>
                <div
                  className={`py-1.5 pr-1.5 text-right tabular-nums ${
                    isNow ? "font-semibold text-white" : "text-slate-500"
                  }`}
                >
                  {isNow ? "now" : formatHour(row.hour)}
                </div>
                {row.cells.map((cell, columnIndex) => (
                  <div
                    key={cell.dateKey}
                    className={`py-1.5 tabular-nums ${
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
                  </div>
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-500">
        <span>colder</span>
        <span
          className="h-2 w-20 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.8), rgba(148,163,184,0.15), rgba(239,68,68,0.8))",
          }}
        />
        <span>warmer</span>
        <span className="ml-1">· shaded vs {todayLabel}, same hour</span>
      </div>
    </div>
  );
}

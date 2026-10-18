import type { DaySeries, Metric, Unit } from "../weather/common.ts";
import { HALF_WINDOW } from "../weather/groupByDay.ts";
import { chartView, type ChartVariable } from "./chartVariable.ts";
import { dayColor } from "./dayColor.ts";
import { OverlayChart, PAD } from "./OverlayChart.tsx";
import { TimeAxis } from "./TimeAxis.tsx";
import { useElementWidth } from "./useElementWidth.ts";
import { useScrub } from "./useScrub.ts";

const LANES: ChartVariable[] = ["temperature", "rain", "wind"];
const HEADINGS: Record<ChartVariable, string> = {
  temperature: "Temperature",
  wind: "Wind",
  rain: "Rain",
};
/** Every lane gets the same plot height, so the three read on equal terms.
 * Sized so the whole stack fits above the fold on a 402 × 874 phone. */
const PLOT_HEIGHT = 110;

/**
 * Temperature, rain and wind as stacked charts on one shared −12h…+12h axis,
 * so all three read together without tabs. One time cursor runs through all
 * of them: it rests at now, and dragging (or hovering) anywhere on the stack
 * moves it. Each chart's heading reads out every shown day's value at the
 * cursor, in the day's colour, so nothing covers the lines.
 */
export function ChartStack(props: {
  series: DaySeries[];
  metric: Metric;
  unit: Unit;
  temperatureUnit: string;
  currentHour: number;
  hiddenOffsets: Set<number>;
}) {
  const { series, metric, unit, temperatureUnit, currentHour, hiddenOffsets } = props;
  const { ref, width } = useElementWidth();
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const { cursor, active, handlers, style } = useScrub({ left: PAD.left, width: plotWidth });
  const visible = series.filter((day) => !hiddenOffsets.has(day.offset));
  return (
    <div ref={ref} className="flex flex-col gap-2" style={style} {...handlers}>
      <TimeAxis
        plotLeft={PAD.left}
        plotWidth={plotWidth}
        currentHour={currentHour}
        cursor={cursor}
      />
      {LANES.map((variable) => {
        const view = chartView({ variable, metric, unit, temperatureUnit });
        const isTemperature = variable === "temperature";
        return (
          <section key={variable} className="flex flex-col">
            <div
              className="flex items-baseline justify-between gap-2 text-[13px] leading-[18px]"
              style={{ paddingLeft: PAD.left, paddingRight: PAD.right }}
            >
              <h2 className="font-medium text-neutral-300">{HEADINGS[variable]}</h2>
              <div className="flex items-baseline gap-2 tabular-nums">
                {visible.map((day) => {
                  const reading = day.slots[cursor + HALF_WINDOW];
                  return (
                    <span
                      key={day.dateKey}
                      className={day.offset === 0 ? "font-semibold" : "font-medium"}
                      style={{ color: dayColor(day.offset).text }}
                    >
                      {reading ? view.format(view.value(reading)) : "–"}
                      {isTemperature && "°"}
                    </span>
                  );
                })}
                {!isTemperature && (
                  <span className="text-[11px] text-neutral-500">{view.unitSymbol.trim()}</span>
                )}
              </div>
            </div>
            <OverlayChart
              series={series}
              value={view.value}
              axisSuffix={view.axisSuffix}
              clampZero={view.clampZero}
              currentHour={currentHour}
              hiddenOffsets={hiddenOffsets}
              plotHeight={PLOT_HEIGHT}
              cursor={cursor}
              scrubbing={active}
            />
          </section>
        );
      })}
    </div>
  );
}

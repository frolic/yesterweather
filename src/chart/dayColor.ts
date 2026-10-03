/** Visual styling for a day's line, keyed by its offset from today.
 *
 * Colour says where a day sits in time: past days are gray (already happened),
 * today is gold (the hero line), and future days are teal. Both days on a side
 * share one colour; the day two away is dashed and a little thinner. */
export type DayStyle = {
  color: string;
  width: number;
  opacity: number;
  dash?: string;
};

const PAST = "#6e737b";
const TODAY = "#f2c94c";
const FUTURE = "#1fa596";
const FAR_DASH = "5 4";

const STYLES = new Map<number, DayStyle>([
  [-2, { color: PAST, width: 1.75, opacity: 1, dash: FAR_DASH }],
  [-1, { color: PAST, width: 1.75, opacity: 1 }],
  [0, { color: TODAY, width: 3, opacity: 1 }],
  [1, { color: FUTURE, width: 1.75, opacity: 1 }],
  [2, { color: FUTURE, width: 1.75, opacity: 1, dash: FAR_DASH }],
]);

const FALLBACK = { color: "#a3a3a3", width: 1.5, opacity: 1 } satisfies DayStyle;

export function dayColor(offset: number): DayStyle {
  return STYLES.get(offset) ?? FALLBACK;
}

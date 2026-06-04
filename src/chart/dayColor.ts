/** Visual styling for a day's line, keyed by its offset from today.
 *
 * Two channels keep the overlay readable: stroke width encodes distance from
 * today (3 = today, 2 = ±1 day, 1 = ±2 days), and colour encodes direction in
 * time — past days are purple, today is yellow (the hero line), and future days
 * are green. */
export type DayStyle = {
  color: string;
  width: number;
  opacity: number;
  dash?: string;
};

const COLORS: Record<number, string> = {
  [-2]: "#6366f1", // deeper blue-purple — older past
  [-1]: "#818cf8", // lighter blue-purple — yesterday
  [0]: "#facc15", // bright yellow — today
  [1]: "#4ade80", // lighter green — tomorrow
  [2]: "#22c55e", // deeper green — day after
};

export function dayColor(offset: number): DayStyle {
  const distance = Math.abs(offset);
  return {
    color: COLORS[offset] ?? "#94a3b8",
    width: Math.max(1, 3 - distance),
    opacity: distance === 0 ? 1 : distance === 1 ? 0.95 : 0.85,
  };
}

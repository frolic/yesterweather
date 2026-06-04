const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Short weekday name ("Mon", "Tue", …) for a local "YYYY-MM-DD" date key.
 * Parsed at UTC noon so DST never shifts the weekday. */
export function weekdayLabel(dateKey: string): string {
  return WEEKDAYS[new Date(`${dateKey}T12:00:00Z`).getUTCDay()];
}

/** Clock-hour label like "12am", "9am", "3pm" for an hour 0–23. */
export const formatHour = (hour: number) => {
  const period = hour < 12 ? "am" : "pm";
  const base = hour % 12 === 0 ? 12 : hour % 12;
  return `${base}${period}`;
};

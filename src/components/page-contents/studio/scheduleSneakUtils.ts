function formatDayMonthPL(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatSneakDayHeader(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return `Dziś, ${formatDayMonthPL(dateStr)}`;
  if (dateStr === addDaysStr(todayStr, 1)) return `Jutro, ${formatDayMonthPL(dateStr)}`;
  const weekday = new Date(dateStr + "T00:00:00").toLocaleDateString("pl-PL", { weekday: "long" });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday}, ${formatDayMonthPL(dateStr)}`;
}

/** A session counts as over once its end time has passed, regardless of status. */
export function isSessionOver(endTimeIso: string, now: Date): boolean {
  return new Date(endTimeIso).getTime() <= now.getTime();
}

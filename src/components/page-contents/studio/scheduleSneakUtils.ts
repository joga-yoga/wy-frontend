import { isAtOrPastWarsawWallClock } from "@/lib/warsawWallClock";

function formatDayMonthPL(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.toLocaleDateString("pl-PL", { day: "numeric" });
  const month = d.toLocaleDateString("pl-PL", { month: "short" }).replace(".", "");
  return `${day} ${month}`;
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatSneakDayHeader(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return `DZIŚ · ${formatDayMonthPL(dateStr)}`;
  if (dateStr === addDaysStr(todayStr, 1)) return `JUTRO · ${formatDayMonthPL(dateStr)}`;
  const weekday = new Date(dateStr + "T00:00:00")
    .toLocaleDateString("pl-PL", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  return `${weekday} · ${formatDayMonthPL(dateStr)}`;
}

/** A session counts as over once its end time has passed, regardless of status. */
export function isSessionOver(endTimeIso: string, now: Date): boolean {
  return isAtOrPastWarsawWallClock(endTimeIso, now);
}

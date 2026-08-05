/**
 * The app has no per-studio timezone support: every stored session start/end time is
 * Europe/Warsaw wall-clock time, entered as-is with no timezone conversion. The backend
 * column is `timestamptz`, so the API serializes these values with a trailing "Z" as if
 * they were real UTC instants -- they are not. `new Date(iso)` therefore parses them as
 * UTC and produces an instant shifted by the Warsaw UTC offset (currently +2h in summer).
 *
 * These helpers compare the wall-clock digits directly instead, which is what the rest of
 * the app already assumes when it displays these strings (e.g. by regex-extracting "HH:MM").
 */

function toWarsawWallClockIso(date: Date): string {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return formatted.replace(" ", "T");
}

function stripTimezoneSuffix(iso: string): string {
  return iso.replace(/Z$|[+-]\d{2}:\d{2}$/, "");
}

/** True once `now` has reached or passed the given Warsaw wall-clock timestamp. */
export function isAtOrPastWarsawWallClock(iso: string, now: Date): boolean {
  return toWarsawWallClockIso(now) >= stripTimezoneSuffix(iso);
}

/** True once `now` has strictly passed the given Warsaw wall-clock timestamp. */
export function isPastWarsawWallClock(iso: string, now: Date): boolean {
  return toWarsawWallClockIso(now) > stripTimezoneSuffix(iso);
}

/** Today's calendar date in Europe/Warsaw, as "YYYY-MM-DD" — for the live-window check
 * (spec §2.1), which must not drift from the wall-clock the rest of this file assumes. */
export function warsawCalendarDate(now: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

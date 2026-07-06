const DAY_LABELS = ["PN", "WT", "ŚR", "CZ", "PT", "SO", "ND"];
const WEEKEND_INDICES = new Set([5, 6]); // SO, ND

export interface DayInfo {
  date: string;
  dayNumber: number;
  dayLabel: string;
  isMuted: boolean;
  isWeekend: boolean;
  isToday: boolean;
  isPast: boolean;
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * `sessionsKnown` gates whether a day with no sessions should be muted. Preview weeks in the
 * swipeable track don't have real session data yet, so they pass `false` to avoid muting every
 * day based on data we don't actually have.
 */
export function buildWeekDays(
  weekStart: Date,
  sessionCounts: number[],
  todayStr: string,
  sessionsKnown = true,
): DayInfo[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = toDateStr(d);
    const isPast = dateStr < todayStr;
    const hasSessions = (sessionCounts[i] ?? 0) > 0;
    return {
      date: dateStr,
      dayNumber: d.getDate(),
      dayLabel: DAY_LABELS[i],
      isMuted: isPast || (sessionsKnown && !hasSessions),
      isWeekend: WEEKEND_INDICES.has(i),
      isToday: dateStr === todayStr,
      isPast,
    };
  });
}

export function getLabelColorClass(day: DayInfo): string {
  if (day.isMuted) return "text-gray-300";
  if (day.isWeekend) return "text-brand-red";
  return "text-gray-500";
}

export function getNumberColorClass(day: DayInfo, isSelected: boolean): string {
  if (day.isToday) return isSelected ? "text-white" : "text-brand-green-700";
  if (isSelected) return "text-white";
  if (day.isMuted) return "text-gray-300";
  return "text-gray-900";
}

export function getCircleBackgroundClass(day: DayInfo): string {
  return day.isToday ? "bg-brand-green-700" : "bg-gray-900";
}

export function shouldCommitSwipe(offsetX: number, velocityX: number, width: number): boolean {
  if (width <= 0) return false;
  const DISTANCE_RATIO = 0.3;
  const VELOCITY_THRESHOLD = 500;
  return Math.abs(offsetX) > width * DISTANCE_RATIO || Math.abs(velocityX) > VELOCITY_THRESHOLD;
}

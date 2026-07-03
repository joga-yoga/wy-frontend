"use client";

import { cn } from "@/lib/utils";

const DAY_LABELS = ["PN", "WT", "ŚR", "CZ", "PT", "SO", "ND"];
const WEEKEND_INDICES = new Set([5, 6]); // SO, ND

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface DayInfo {
  date: string;
  dayNumber: number;
  dayLabel: string;
  hasSessions: boolean;
  isWeekend: boolean;
  isToday: boolean;
  isPast: boolean;
}

interface DayStripProps {
  weekStart: Date;
  sessionCounts: number[];
  selectedIndex: number;
  onSelectDay: (index: number) => void;
}

/**
 * Public-schedule-only day strip (brief §2.3). Forked from the owner-dashboard DayStrip
 * because the two surfaces' today/selected visual rules diverge (green marker + weekend
 * tinting here vs. ring/fill-only there) — not a parameterization of the shared component.
 */
export function DayStrip({ weekStart, sessionCounts, selectedIndex, onSelectDay }: DayStripProps) {
  const todayStr = toDateStr(new Date());

  const days: DayInfo[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = toDateStr(d);
    return {
      date: dateStr,
      dayNumber: d.getDate(),
      dayLabel: DAY_LABELS[i],
      hasSessions: (sessionCounts[i] ?? 0) > 0,
      isWeekend: WEEKEND_INDICES.has(i),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
    };
  });

  return (
    <div className="flex justify-between gap-1">
      {days.map((day, i) => {
        const isSelected = i === selectedIndex;
        const isTodayNotSelected = day.isToday && !isSelected;

        let labelClass = "text-gray-500";
        // if (day.isToday) {
        //   labelClass = "text-brand-green";
        // } else
        if (day.isPast) {
          labelClass = "text-gray-300";
        } else if (day.isWeekend) {
          labelClass = "text-brand-red";
        }

        let numberClass = "text-gray-900";
        if (day.isToday) {
          // numberClass = "text-brand-green";
          numberClass = isSelected ? "text-white" : "text-brand-green-700";
        } else if (isSelected) {
          numberClass = "text-white";
        } else if (day.isPast) {
          numberClass = "text-gray-300";
        }

        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDay(i)}
            className="flex min-w-[40px] flex-col items-center gap-1 px-1.5 py-1"
          >
            <span className={cn("text-xs font-medium uppercase", labelClass)}>{day.dayLabel}</span>
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold",
                isSelected && "bg-gray-900",
                isSelected && day.isToday && "bg-brand-green-700",
                day.isToday && "shadow-[inset_0_0_0_2px_var(--brand-green-700)]",
                numberClass,
              )}
            >
              {day.dayNumber}
            </span>
            <span
              className={cn(
                "h-1 w-1 rounded-full",
                day.hasSessions ? "bg-gray-400" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

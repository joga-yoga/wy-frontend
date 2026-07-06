"use client";

import { cn } from "@/lib/utils";

import { buildWeekDays, getLabelColorClass } from "./dayStripUtils";

interface LabelRowProps {
  weekStart: Date;
  todayStr: string;
  sessionCounts: number[];
  isLoading: boolean;
}

export function LabelRow({ weekStart, todayStr, sessionCounts, isLoading }: LabelRowProps) {
  const days = buildWeekDays(weekStart, sessionCounts, todayStr, !isLoading);

  return (
    <div className="flex justify-between gap-1">
      {days.map((day) => (
        <span
          key={day.date}
          className={cn(
            "w-[40px] px-1.5 text-center text-xs font-medium uppercase",
            getLabelColorClass(day),
          )}
        >
          {day.dayLabel}
        </span>
      ))}
    </div>
  );
}

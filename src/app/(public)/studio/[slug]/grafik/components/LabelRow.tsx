"use client";

import { cn } from "@/lib/utils";

import { buildWeekDays, getLabelColorClass } from "./dayStripUtils";

interface LabelRowProps {
  weekStart: Date;
  todayStr: string;
}

export function LabelRow({ weekStart, todayStr }: LabelRowProps) {
  const days = buildWeekDays(weekStart, [], todayStr);

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

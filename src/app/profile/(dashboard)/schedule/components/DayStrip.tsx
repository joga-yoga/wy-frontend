"use client";

const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface DayInfo {
  date: string;
  dayNumber: number;
  dayLabel: string;
  hasOccurrences: boolean;
  isPast: boolean;
  isToday: boolean;
}

interface DayStripProps {
  weekStart: Date;
  sessionCounts: number[];
  selectedIndex: number;
  onSelect?: (index: number) => void;
  readOnly?: boolean;
}

export function DayStrip({
  weekStart,
  sessionCounts,
  selectedIndex,
  onSelect,
  readOnly = false,
}: DayStripProps) {
  const todayStr = toDateStr(new Date());

  const days: DayInfo[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = toDateStr(d);
    return {
      date: dateStr,
      dayNumber: d.getDate(),
      dayLabel: DAY_LABELS[i],
      hasOccurrences: (sessionCounts[i] ?? 0) > 0,
      isPast: dateStr < todayStr,
      isToday: dateStr === todayStr,
    };
  });

  return (
    <div className="flex justify-between gap-1">
      {days.map((day, i) => {
        const isSelected = i === selectedIndex;

        let bg: string;
        let text: string;
        if (isSelected && day.isToday) {
          // bg = "bg-brand-green text-white";
          bg = "bg-gray-900 text-white ring-2 ring-brand-green";
          text = "";
        } else if (isSelected && day.isPast) {
          bg = "bg-gray-400 text-white";
          text = "";
        } else if (isSelected) {
          bg = "bg-gray-900 text-white";
          text = "";
        } else if (day.isToday) {
          bg = "ring-2 ring-brand-green";
          text = "text-gray-900";
        } else if (day.isPast) {
          bg = "";
          text = "text-gray-300";
        } else if (readOnly) {
          bg = "";
          text = "text-gray-600";
        } else {
          bg = "hover:bg-gray-100";
          text = "text-gray-600";
        }

        return (
          <button
            key={day.date}
            onClick={() => !readOnly && onSelect?.(i)}
            disabled={readOnly}
            className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors min-w-[40px] ${bg} ${text}`}
          >
            <span className="text-[10px] font-medium uppercase">{day.dayLabel}</span>
            <span className="text-sm font-semibold">{day.dayNumber}</span>
            {day.hasOccurrences && (
              <span
                className={`h-1 w-1 rounded-full ${
                  isSelected ? "bg-white" : day.isPast ? "bg-gray-300" : "bg-gray-400"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

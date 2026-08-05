import { HashedAvatar } from "@/components/common/HashedAvatar";
import { type ClassColor, COLOR_BORDER_MAP, DEFAULT_BORDER } from "@/lib/classColors";
import { cn } from "@/lib/utils";

function formatDayMonth(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  const day = d.toLocaleDateString("pl-PL", { day: "numeric" });
  const month = d.toLocaleDateString("pl-PL", { month: "short" }).replace(".", "");
  return { day, month: month.toUpperCase() };
}

function formatWeekday(iso: string): string {
  const label = new Date(iso).toLocaleDateString("pl-PL", { weekday: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

interface OccurrenceHeroProps {
  title: string;
  calendarDate: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number | null;
  color?: ClassColor | null;
  instructor?: { id?: string; name: string; imageId?: string | null } | null;
  /** Confirmation card sizing (§6) — smaller, never shows the instructor row. */
  compact?: boolean;
  className?: string;
}

export function OccurrenceHero({
  title,
  calendarDate,
  startTime,
  endTime,
  durationMinutes,
  color,
  instructor,
  compact = false,
  className,
}: OccurrenceHeroProps) {
  const { day, month } = formatDayMonth(calendarDate);
  const borderClass = color ? COLOR_BORDER_MAP[color] : DEFAULT_BORDER;
  const duration =
    durationMinutes ??
    Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
  const calSize = compact ? 48 : 52;

  return (
    <div className={cn("rounded-2xl border-2 p-4", borderClass, className)}>
      <div className="flex items-start gap-3.5">
        <div
          className="flex shrink-0 flex-col items-center justify-center rounded-[13px] bg-[#f4f2ee]"
          style={{ width: calSize, height: calSize }}
        >
          <span
            className={cn(
              "font-extrabold leading-none text-gray-900",
              compact ? "text-lg" : "text-xl",
            )}
          >
            {day}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            {month}
          </span>
        </div>
        <div className="min-w-0 flex-1 pt-px">
          <p
            className={cn(
              "font-extrabold leading-tight text-gray-900",
              compact ? "text-lg" : "text-xl",
            )}
          >
            {title}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            {formatWeekday(calendarDate)} · {formatTime(startTime)}–{formatTime(endTime)} ·
            <span className="ml-1 text-gray-400">{duration} min</span>
          </p>
          {!compact && instructor && (
            <div className="mt-3.5 flex items-center gap-2.5">
              <HashedAvatar
                seed={instructor.id ?? instructor.name}
                name={instructor.name}
                imageId={instructor.imageId}
                size={30}
              />
              <span className="text-sm font-semibold text-gray-700">{instructor.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

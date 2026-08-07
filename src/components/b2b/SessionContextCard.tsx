import { HashedAvatar } from "@/components/common/HashedAvatar";
import {
  type ClassColor,
  COLOR_BORDER_MAP,
  COLOR_SWATCH_MAP,
  DEFAULT_BAR,
  DEFAULT_BORDER,
} from "@/lib/classColors";
import { cn } from "@/lib/utils";

/**
 * The "what am I acting on" card that opens every step of every schedule-management flow
 * (S2–S4, S8, S9): a colored left bar, the class title, and a scope line.
 *
 * One component for all of them so the scope a user picked stays visible and identically
 * presented from Zakres through Podgląd to Zapis — the pipeline's whole point is that no
 * change is applied without the user having seen its scope.
 *
 * Visual language echoes `GrafikSessionCard` (the session row on the Grafik page) exactly —
 * same `w-14` time+duration column, `w-1` colour bar, instructor avatar+name row, status
 * badges — so a session looks like the same object whether you're looking at it in the list or
 * acting on it here. Two differences from that card: no chevron (this card is never itself
 * tappable — it's a static context header) and no slots/fill count (not relevant to "what am I
 * editing"). It adds one thing the list doesn't need: an explicit date, since unlike Grafik's
 * day-grouped list, this card is shown standalone with no day header to imply it.
 */
export function SessionContextCard({
  title,
  date,
  time,
  durationMinutes,
  color,
  subtitle,
  instructor,
  badges,
  tone = "default",
}: {
  title: string;
  /** Shown as a small eyebrow line above the title, e.g. "Śro. 12 sierpnia" — Grafik's
   * day-grouped list implies this instead, but this card is shown standalone. */
  date?: string | null;
  /** "HH:MM", drawn in the same left column as Grafik. Omit when no session time exists yet
   * (e.g. picking a template before a time has been chosen). */
  time?: string | null;
  durationMinutes?: number | null;
  /** The class's colour, same values as `GrafikSessionCard`'s `occ.color` — drives the border
   * and left bar exactly like the Grafik row so a session reads as the same coloured object in
   * both places. Falls back to the neutral grey Grafik uses for uncoloured classes. */
  color?: string | null;
  subtitle?: string | null;
  instructor?: {
    id?: string | null;
    name: string;
    imageId?: string | null;
  } | null;
  badges?: string[];
  /** "danger" for the cancellation flow, where the same card frames a destructive action. */
  tone?: "default" | "danger";
}) {
  const classColor = color as ClassColor | null | undefined;
  const borderClass =
    tone === "danger"
      ? "border-b2b-red-border"
      : classColor
        ? COLOR_BORDER_MAP[classColor]
        : DEFAULT_BORDER;
  const barClass =
    tone === "danger"
      ? "bg-b2b-red-solid"
      : classColor
        ? COLOR_SWATCH_MAP[classColor]
        : DEFAULT_BAR;

  return (
    <div
      className={cn(
        "flex items-stretch gap-3 rounded-xl border-[1.5px] bg-white px-3 py-2.5",
        borderClass,
        tone === "danger" && "bg-b2b-red-bg",
      )}
    >
      {time && (
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 text-center">
          <span
            className={cn(
              "text-xl font-semibold",
              tone === "danger" ? "text-b2b-red-text" : "text-gray-900",
            )}
          >
            {time}
          </span>
          {durationMinutes != null && (
            <span
              className={cn(
                "text-sm",
                tone === "danger" ? "text-b2b-red-text/60" : "text-gray-400",
              )}
            >
              {durationMinutes} min
            </span>
          )}
        </div>
      )}
      <div className={cn("w-1 shrink-0 self-stretch rounded-full", barClass)} />
      <div className="min-w-0 flex-1 py-0.5">
        {date && (
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-wide",
              tone === "danger" ? "text-b2b-red-text/70" : "text-gray-400",
            )}
          >
            {date}
          </p>
        )}
        <p
          className={cn(
            "truncate text-md font-semibold",
            tone === "danger" ? "text-b2b-red-text" : "text-gray-900",
          )}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className={cn(
              "mt-0.5 text-[13px]",
              tone === "danger" ? "text-b2b-red-text/80" : "text-gray-500",
            )}
          >
            {subtitle}
          </p>
        )}
        {instructor && (
          <div className="mt-1 flex items-center gap-1.5">
            <HashedAvatar
              seed={instructor.id ?? instructor.name}
              name={instructor.name}
              imageId={instructor.imageId}
              size={20}
            />
            <span className="truncate text-sm text-gray-500">{instructor.name}</span>
          </div>
        )}
        {badges && badges.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {badges.map((label) => (
              <span
                key={label}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

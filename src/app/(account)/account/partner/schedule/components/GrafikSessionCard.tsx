"use client";

import { Pencil } from "lucide-react";
import { IoChevronForward } from "react-icons/io5";

import { InstructorAvatar } from "@/components/common/InstructorAvatar";
import { COLOR_SWATCH_MAP, DEFAULT_BAR } from "@/lib/classColors";
import { cn } from "@/lib/utils";
import { isPastWarsawWallClock } from "@/lib/warsawWallClock";

import type { ScheduleOccurrence } from "../types";

const NEARLY_FULL_RATIO = 0.8;

type PrimaryState = "cancelled" | "past" | "full" | "nearly-full" | "default";

function computePrimaryState(occ: ScheduleOccurrence, now: Date): PrimaryState {
  if (occ.status === "cancelled") return "cancelled";
  if (isPastWarsawWallClock(occ.start_time, now)) return "past";
  if (occ.capacity && occ.fill_count >= occ.capacity) return "full";
  if (occ.capacity && occ.fill_count >= occ.capacity * NEARLY_FULL_RATIO) return "nearly-full";
  return "default";
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatDurationMinutes(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${mins} min`;
}

/** Fill-badge tone. Green reads "there is still room", so a past or cancelled session must
 * never use it — those are gray regardless of how full they were. */
function fillToneClass(state: PrimaryState): string {
  switch (state) {
    case "full":
      return "bg-b2b-red-bg text-b2b-red-text";
    case "nearly-full":
      return "bg-b2b-amber-bg text-b2b-amber-text";
    case "past":
    case "cancelled":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-b2b-green-bg text-b2b-green-text";
  }
}

/**
 * One session row in Grafik (mockup A1).
 *
 * Renders as a **row, not a card**: the parent wraps the day's rows in one bordered container
 * with dividers between them, which is how A1 draws it. So this component owns no outer
 * border, rounding or shadow. Previously it was a standalone card with a colored border and
 * gaps between cards, which was the largest visual difference from the prototype.
 *
 * Layout: time + duration column, a thin bar carrying the class color, title and who/where,
 * then the fill badge in its own right-hand column before the chevron. The badge reads bare
 * ("9/12"), not "9/12 zapisanych".
 */
export function GrafikSessionCard({
  occ,
  onClick,
  now = new Date(),
  context = "owner",
}: {
  occ: ScheduleOccurrence;
  onClick: (occ: ScheduleOccurrence) => void;
  now?: Date;
  /** "owner" (default) shows who's teaching; "instructor" is the read-only "Mój
   * grafik" view of your own sessions, where showing the studio matters more. */
  context?: "owner" | "instructor";
}) {
  const state = computePrimaryState(occ, now);
  const isCancelled = state === "cancelled";
  const isPast = state === "past";
  const isDimmed = isCancelled || isPast;

  const color = occ.color as keyof typeof COLOR_SWATCH_MAP | null | undefined;
  // A finished or cancelled session keeps its slot but drops its color, so the row reads as
  // settled rather than as another live class.
  const barClass = !isDimmed && color ? COLOR_SWATCH_MAP[color] : DEFAULT_BAR;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(occ)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(occ);
      }}
      className={cn(
        "flex cursor-pointer items-stretch gap-3 px-3 py-3 transition-colors hover:bg-gray-50",
        isDimmed && "opacity-60",
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-start justify-center gap-0.5">
        <span
          className={cn(
            "text-[17px] font-bold leading-tight",
            isDimmed ? "text-gray-400" : "text-gray-900",
            isCancelled && "line-through",
          )}
        >
          {formatTime(occ.start_time)}
        </span>
        <span className="text-xs text-gray-400">
          {formatDurationMinutes(occ.start_time, occ.end_time)}
        </span>
      </div>

      <div className={cn("w-[3px] shrink-0 self-stretch rounded-full", barClass)} />

      <div className="min-w-0 flex-1 self-center">
        <p
          className={cn(
            "text-[15px] font-semibold leading-snug",
            isDimmed ? "text-gray-400" : "text-gray-900",
            isCancelled && "line-through",
          )}
        >
          {occ.template_title}
        </p>

        {isPast && !isCancelled && <p className="mt-0.5 text-[13px] text-gray-400">Zakończone</p>}

        {!isCancelled && !isPast && context === "owner" && occ.instructor_name && (
          <div className="mt-1 flex items-center gap-1.5">
            <InstructorAvatar
              name={occ.instructor_name}
              imageId={occ.instructor_image_id}
              size={18}
            />
            {/* Instructor before room, as drawn ("Oleg · Sala 1"). */}
            <span className="truncate text-[13px] text-gray-500">
              {[occ.instructor_name, occ.room_name].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}

        {!isCancelled &&
          !isPast &&
          context === "instructor" &&
          (occ.studio_name || occ.room_name) && (
            <p className="mt-1 truncate text-[13px] text-gray-500">
              {[occ.studio_name, occ.room_name].filter(Boolean).join(" · ")}
            </p>
          )}

        {(isCancelled || occ.is_modified) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isCancelled && (
              <span className="rounded-full bg-b2b-red-bg px-2 py-0.5 text-[11px] font-medium text-b2b-red-text">
                Odwołane
              </span>
            )}
            {occ.is_modified && !isCancelled && (
              <span className="flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                <Pencil size={10} />
                Wyjątek
              </span>
            )}
          </div>
        )}
      </div>

      {occ.capacity ? (
        <div className="flex shrink-0 items-center">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[13px] font-semibold tabular-nums",
              fillToneClass(state),
            )}
          >
            {occ.fill_count}/{occ.capacity}
          </span>
        </div>
      ) : null}

      <div className="flex w-5 shrink-0 items-center text-gray-300">
        {!isDimmed && <IoChevronForward className="h-5 w-5" />}
      </div>
    </div>
  );
}

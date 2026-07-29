"use client";

import { Pencil } from "lucide-react";
import { IoChevronForward } from "react-icons/io5";

import { InstructorAvatar } from "@/components/common/InstructorAvatar";
import { COLOR_BORDER_MAP, COLOR_SWATCH_MAP, DEFAULT_BAR, DEFAULT_BORDER } from "@/lib/classColors";
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

/**
 * Grafik's owner-facing session row — same colored-border / time-column / instructor
 * avatar visual language as the public studio schedule's `SessionCard`, reusing its
 * color utilities (`lib/classColors`) and `InstructorAvatar` directly rather than
 * reinventing them. Diverges where the semantics differ: no booking state (this is
 * the owner's view, not a participant's), tap opens the session panel instead of a
 * booking flow, and an "wyjątek" badge replaces the change-annotation footer.
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
  const isDimmed = isCancelled || isPast || state === "full";

  const showColorBorder = state === "default" || state === "nearly-full" || state === "full";
  const color = occ.color as keyof typeof COLOR_BORDER_MAP | null | undefined;
  const borderClass = showColorBorder && color ? COLOR_BORDER_MAP[color] : DEFAULT_BORDER;
  const barClass = showColorBorder && color ? COLOR_SWATCH_MAP[color] : DEFAULT_BAR;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(occ)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(occ);
      }}
      className={cn(
        "flex cursor-pointer items-stretch gap-3 overflow-hidden rounded-xl border-[1.5px] bg-white px-3 py-2.5 transition-colors hover:bg-gray-50",
        borderClass,
        isDimmed && "opacity-60",
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 text-center">
        <span
          className={cn(
            "text-xl font-semibold",
            isCancelled || isPast ? "text-gray-400" : "text-gray-900",
            isCancelled && "line-through",
          )}
        >
          {formatTime(occ.start_time)}
        </span>
        <span className="text-sm text-gray-400">
          {formatDurationMinutes(occ.start_time, occ.end_time)}
        </span>
      </div>

      <div className={cn("w-1 shrink-0 self-stretch rounded-full", barClass)} />

      <div className="min-w-0 flex-1 py-0.5">
        <p
          className={cn(
            "truncate text-md font-semibold",
            isCancelled || isPast ? "text-gray-400" : "text-gray-900",
            isCancelled && "line-through",
          )}
        >
          {occ.template_title}
        </p>

        {!isCancelled && context === "owner" && occ.instructor_name && (
          <div className="mt-1 flex items-center gap-1.5">
            <InstructorAvatar
              name={occ.instructor_name}
              imageId={occ.instructor_image_id}
              size={20}
            />
            <span className="truncate text-sm text-gray-500">
              {[occ.room_name, occ.instructor_name].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}

        {!isCancelled && context === "instructor" && (occ.studio_name || occ.room_name) && (
          <p className="mt-1 truncate text-sm text-gray-500">
            {[occ.studio_name, occ.room_name].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {occ.is_modified && !isCancelled && (
            <span className="flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              <Pencil size={10} />
              Wyjątek
            </span>
          )}
          {isCancelled && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
              Odwołane
            </span>
          )}
          {isPast && <span className="text-[11px] text-gray-400">Zakończone</span>}
          {!isCancelled && occ.capacity ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                state === "full"
                  ? "bg-red-50 text-red-600"
                  : state === "nearly-full"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-600",
              )}
            >
              {occ.fill_count}/{occ.capacity} zapisanych
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center text-gray-400">
        <IoChevronForward className="h-5 w-5" />
      </div>
    </div>
  );
}

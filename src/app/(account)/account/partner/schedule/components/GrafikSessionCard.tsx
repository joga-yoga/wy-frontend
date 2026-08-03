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
 * One session card in Grafik.
 *
 * Deliberately built on the **public studio schedule's** `SessionCard` geometry
 * (`(public)/studio/[slug]/schedule/components/SessionCard.tsx`) so the partner sees the
 * same object drawn the same way as their customers do: a separated, rounded card carrying
 * the class colour on its own border, a wide centred time column, a `w-1` colour bar, and a
 * gray-500 chevron. It previously rendered as a borderless row inside one shared bordered
 * container, which read as a completely different component.
 *
 * The one B2B-only addition is the availability counter — the bare `9/12` fill badge, which
 * is owner information the public card has no equivalent of.
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
  // A finished or cancelled session keeps its slot but drops its colour, so the card reads as
  // settled rather than as another live class — same rule the public card applies.
  const borderClass = !isDimmed && color ? COLOR_BORDER_MAP[color] : DEFAULT_BORDER;
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
        "flex cursor-pointer items-stretch gap-3 overflow-hidden rounded-xl border-[1.5px] bg-white px-3 py-2.5 transition-colors hover:bg-gray-50",
        borderClass,
        isDimmed && "opacity-60",
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 text-center">
        <span
          className={cn(
            "text-xl font-semibold",
            isDimmed ? "text-gray-400" : "text-gray-900",
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

      <div className="min-w-0 flex-1 self-center py-0.5">
        <p
          className={cn(
            "truncate text-md font-semibold",
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
              size={20}
            />
            {/* Instructor before room, as drawn ("Oleg · Sala 1"). */}
            <span className="truncate text-sm text-gray-500">
              {[occ.instructor_name, occ.room_name].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}

        {!isCancelled &&
          !isPast &&
          context === "instructor" &&
          (occ.studio_name || occ.room_name) && (
            <p className="mt-1 truncate text-sm text-gray-500">
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

      {/* Unlike the public card, the chevron stays on past and cancelled sessions: in Grafik
       * they are still openable (attendance list, reconciliation), so hiding it would say
       * "not tappable" about a row that is. */}
      <div className="flex shrink-0 items-center text-gray-500">
        <IoChevronForward className="h-5 w-5" />
      </div>
    </div>
  );
}

"use client";

import { Check, Clock } from "lucide-react";

import { HashedAvatar } from "@/components/common/HashedAvatar";
import { SessionCardBase } from "@/components/common/SessionCardBase";
import { COLOR_BORDER_MAP, DEFAULT_BORDER } from "@/lib/classColors";
import { cn } from "@/lib/utils";
import { isPastWarsawWallClock } from "@/lib/warsawWallClock";

import type { PublicOccurrence } from "../types";

export const NEARLY_FULL_THRESHOLD = 3;
export const BOOKED_GREEN = "#4F8A62";

export { COLOR_BORDER_MAP, DEFAULT_BORDER };

type PrimaryState = "cancelled" | "past" | "full" | "nearly-full" | "default";

function computePrimaryState(occ: PublicOccurrence, now: Date): PrimaryState {
  if (occ.status === "cancelled") return "cancelled";
  if (isPastWarsawWallClock(occ.start_time, now)) return "past";
  if (occ.spots_remaining === 0) return "full";
  if (occ.spots_remaining != null && occ.spots_remaining <= NEARLY_FULL_THRESHOLD)
    return "nearly-full";
  return "default";
}

export function formatSpotsRemainingLabel(n: number): string {
  if (n === 1) return "Zostało 1 miejsce";
  if (n >= 2 && n <= 4) return `Zostały ${n} miejsca`;
  return `Zostało ${n} miejsc`;
}

function isChangeAnnotationVisible(occ: PublicOccurrence, now: Date): boolean {
  if (occ.viewer_has_booking) return true;
  if (!occ.modified_at) return false;
  const startMs = new Date(occ.start_time).getTime();
  const modifiedMs = new Date(occ.modified_at).getTime();
  return modifiedMs >= startMs - 48 * 60 * 60 * 1000;
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatDurationMinutes(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${mins} min`;
}

interface SessionCardProps {
  occ: PublicOccurrence;
  onClick?: (occ: PublicOccurrence) => void;
  /** Injectable for deterministic testing; defaults to the real current time. */
  now?: Date;
  /** Which identity to highlight in the card row: the instructor (default, used on
   * Studio profile pages) or the studio (used on Instructor profile pages). */
  context?: "studio" | "instructor";
}

export function SessionCard({
  occ,
  onClick,
  now = new Date(),
  context = "studio",
}: SessionCardProps) {
  const state = computePrimaryState(occ, now);
  const isCancelled = state === "cancelled";
  const isPast = state === "past";
  const isFull = state === "full";
  const isNearlyFull = state === "nearly-full";
  const isDimmed = isCancelled || isPast || isFull;

  const canOpenDetails = isPast ? false : isCancelled ? occ.viewer_has_booking : true;
  const isInteractive = canOpenDetails && Boolean(onClick);
  const showChevron = state === "default" || state === "nearly-full";

  // ⚠ Not the same set as `isDimmed`, and the difference is load-bearing: a **full** session
  // is dimmed but keeps its colour, while past and cancelled ones lose it. Passed to
  // `SessionCardBase` as `colored` rather than left to be derived from `dimmed`.
  const showColorBorder = state === "default" || state === "nearly-full" || state === "full";

  const showBookedFooter = occ.viewer_has_booking && !isCancelled;
  const changeVisible = !isCancelled && !isPast && isChangeAnnotationVisible(occ, now);
  const showTimeChange = changeVisible && !!occ.previous_start_time;
  const showInstructorChange = changeVisible && !!occ.previous_instructor_name;

  return (
    <SessionCardBase
      color={occ.color}
      dimmed={isDimmed}
      colored={showColorBorder}
      struck={isCancelled}
      onClick={isInteractive ? () => onClick?.(occ) : undefined}
      showChevron={showChevron}
      timeAbove={
        showTimeChange ? (
          <span className="text-xs leading-none text-gray-400 line-through">
            {formatTime(occ.previous_start_time!)}
          </span>
        ) : undefined
      }
      time={formatTime(occ.start_time)}
      timeSub={formatDurationMinutes(occ.start_time, occ.end_time)}
      footer={
        showBookedFooter ? (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: BOOKED_GREEN }}
          >
            <Check className="h-3.5 w-3.5" />
            Masz rezerwację na te zajęcia
          </div>
        ) : undefined
      }
    >
      <p
        className={cn(
          "truncate text-md font-semibold",
          isCancelled || isPast ? "text-gray-400" : "text-gray-900",
          isCancelled && "line-through",
        )}
      >
        {occ.template_title}
      </p>

      {!isCancelled && context === "instructor" && occ.studio_name && (
        <div className="mt-1 flex items-center gap-1.5">
          <HashedAvatar
            seed={occ.studio_id ?? occ.studio_name}
            name={occ.studio_name}
            imageId={occ.studio_image_id}
            size={20}
            imageFit="contain"
            className="bg-white"
          />
          <span className="truncate text-sm text-gray-500">{occ.studio_name}</span>
        </div>
      )}

      {!isCancelled && context === "studio" && occ.instructor_name && (
        <div className="mt-1 flex items-center gap-1.5">
          <HashedAvatar
            seed={occ.instructor_id ?? occ.instructor_name}
            name={occ.instructor_name}
            imageId={occ.instructor_image_id}
            size={20}
          />
          <span className="truncate text-sm text-gray-500">{occ.instructor_name}</span>
        </div>
      )}

      {showInstructorChange && (
        <p className="mt-0.5 truncate text-[11px] text-gray-400">
          Zastępstwo za <span className="line-through">{occ.previous_instructor_name}</span>
        </p>
      )}

      {isCancelled ||
      isPast ||
      isFull ||
      (isNearlyFull && occ.spots_remaining != null) ||
      showTimeChange ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {isCancelled && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
              Odwołane
            </span>
          )}
          {isPast && <span className="text-[11px] text-gray-400">Zakończone</span>}
          {isFull && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              Brak wolnych miejsc
            </span>
          )}
          {isNearlyFull && occ.spots_remaining != null && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              {formatSpotsRemainingLabel(occ.spots_remaining)}
            </span>
          )}
          {showTimeChange && (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              <Clock className="h-3 w-3" />
              Nowa godzina
            </span>
          )}
        </div>
      ) : null}
    </SessionCardBase>
  );
}

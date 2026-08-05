"use client";

import { Pencil } from "lucide-react";
import { IoChevronForward } from "react-icons/io5";

import { HashedAvatar } from "@/components/common/HashedAvatar";
import { COLOR_BORDER_MAP, COLOR_SWATCH_MAP, DEFAULT_BAR, DEFAULT_BORDER } from "@/lib/classColors";
import { cn } from "@/lib/utils";
import {
  isAtOrPastWarsawWallClock,
  isPastWarsawWallClock,
  warsawCalendarDate,
} from "@/lib/warsawWallClock";

import type { ScheduleOccurrence } from "../types";

const NEARLY_FULL_RATIO = 0.8;
// spec §2.1: the desk considers a session "live" starting 30 minutes before its scheduled
// start — early arrivals are exactly when the roster becomes actionable.
const LIVE_LEAD_MINUTES = 30;

type PrimaryState = "cancelled" | "live" | "past" | "full" | "nearly-full" | "default";

/** spec §2.1's live window: today, `now >= start - 30min`, `now <= end`, not cancelled.
 * Overlap is intentional (two sessions can both be live during turnover) — this is evaluated
 * per-occurrence with no cross-occurrence suppression. */
function isLiveOccurrence(occ: ScheduleOccurrence, now: Date): boolean {
  if (occ.status === "cancelled") return false;
  if (occ.calendar_date !== warsawCalendarDate(now)) return false;
  // `now >= start - 30min` rearranged as `now + 30min >= start`, so the comparison stays a
  // real Date-arithmetic shift (always correct) rather than string arithmetic on wall-clock
  // digits (which this file's helpers deliberately avoid doing).
  const leadShiftedNow = new Date(now.getTime() + LIVE_LEAD_MINUTES * 60_000);
  if (!isAtOrPastWarsawWallClock(occ.start_time, leadShiftedNow)) return false;
  if (isPastWarsawWallClock(occ.end_time, now)) return false;
  return true;
}

function computePrimaryState(occ: ScheduleOccurrence, now: Date): PrimaryState {
  if (occ.status === "cancelled") return "cancelled";
  if (isLiveOccurrence(occ, now)) return "live";
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
  const isLive = state === "live";
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

        {/* Instructor/studio stays visible even while live — it used to be replaced
         * entirely by the "Trwa" line below, which hid who's teaching or which studio
         * right when someone glancing at the card most needs that context. */}
        {!isCancelled && !isPast && context === "owner" && occ.instructor_name && (
          <div className="mt-1 flex items-center gap-1.5">
            <HashedAvatar
              seed={occ.instructor_id ?? occ.instructor_name}
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

        {/* Live state (spec §2.1/§10) — now a second line below the instructor/studio
         * info, not a replacement for it. */}
        {isLive && (
          <p className="mt-1 text-[13px] font-medium text-b2b-green-text">
            Trwa · do {formatTime(occ.end_time)}
            {occ.unresolved_count > 0 && (
              <span className="text-b2b-amber-text"> · {occ.unresolved_count} czeka</span>
            )}
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
            {/* Live cards report who has actually shown up, not the booking-fill count —
             * spec §2.1's "attended-count over capacity". */}
            {isLive ? occ.attended_count : occ.fill_count}/{occ.capacity}
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

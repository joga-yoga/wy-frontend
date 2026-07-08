"use client";

import { Check, ChevronRight, Clock } from "lucide-react";
import { IoChevronForward } from "react-icons/io5";

import { WyImage } from "@/components/custom/WyImage";
import { cn } from "@/lib/utils";

import type { ClassColor, PublicOccurrence } from "../types";

export const NEARLY_FULL_THRESHOLD = 3;
export const BOOKED_GREEN = "#4F8A62";

export const COLOR_BORDER_MAP: Record<ClassColor, string> = {
  rose: "border-rose-300",
  amber: "border-amber-300",
  lime: "border-lime-400",
  teal: "border-teal-300",
  sky: "border-sky-300",
  violet: "border-violet-300",
  slate: "border-slate-300",
};
export const DEFAULT_BORDER = "border-gray-200";

type PrimaryState = "cancelled" | "past" | "full" | "nearly-full" | "default";

function computePrimaryState(occ: PublicOccurrence, now: Date): PrimaryState {
  if (occ.status === "cancelled") return "cancelled";
  if (new Date(occ.start_time) < now) return "past";
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface SessionCardProps {
  occ: PublicOccurrence;
  onClick?: (occ: PublicOccurrence) => void;
  /** Injectable for deterministic testing; defaults to the real current time. */
  now?: Date;
}

export function SessionCard({ occ, onClick, now = new Date() }: SessionCardProps) {
  const state = computePrimaryState(occ, now);
  const isCancelled = state === "cancelled";
  const isPast = state === "past";
  const isFull = state === "full";
  const isNearlyFull = state === "nearly-full";
  const isDimmed = isCancelled || isPast || isFull;

  const isInteractive = isPast ? false : isCancelled ? occ.viewer_has_booking : true;
  const showChevron = state === "default" || state === "nearly-full";

  const showColorBorder = state === "default" || state === "nearly-full" || state === "full";
  const borderClass = showColorBorder && occ.color ? COLOR_BORDER_MAP[occ.color] : DEFAULT_BORDER;

  const showBookedFooter = occ.viewer_has_booking && !isCancelled;
  const changeVisible = !isCancelled && !isPast && isChangeAnnotationVisible(occ, now);
  const showTimeChange = changeVisible && !!occ.previous_start_time;
  const showInstructorChange = changeVisible && !!occ.previous_instructor_name;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white transition-colors",
        borderClass,
        isDimmed && "opacity-60",
      )}
    >
      <div
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? () => onClick?.(occ) : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onClick?.(occ);
              }
            : undefined
        }
        className={cn("flex items-stretch gap-3 px-3 py-2.5", isInteractive && "cursor-pointer")}
      >
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-gray-100 pr-2 text-center">
          {showTimeChange && (
            <span className="text-xs leading-none text-gray-400 line-through">
              {formatTime(occ.previous_start_time!)}
            </span>
          )}
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

          {!isCancelled && occ.instructor_name && (
            <div className="mt-1 flex items-center gap-1.5">
              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {occ.instructor_image_id ? (
                  <WyImage
                    src={occ.instructor_image_id}
                    alt={occ.instructor_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[8px] font-semibold text-gray-500">
                    {initials(occ.instructor_name)}
                  </span>
                )}
              </div>
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
        </div>

        {showChevron && (
          <div className="flex shrink-0 items-center text-gray-500">
            <IoChevronForward className="h-5 w-5" />
          </div>
        )}
      </div>

      {showBookedFooter && (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: BOOKED_GREEN }}
        >
          <Check className="h-3.5 w-3.5" />
          Masz rezerwację na te zajęcia
        </div>
      )}
    </div>
  );
}

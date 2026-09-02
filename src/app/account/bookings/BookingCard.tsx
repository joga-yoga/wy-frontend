"use client";

import { StatusChip } from "@/components/b2b/StatusChip";
import { SessionCardBase } from "@/components/common/SessionCardBase";
import { cn } from "@/lib/utils";

import type { MyBookingItem } from "../types";

const FUNDING_LABEL: Record<string, string> = {
  drop_in: "wejście jednorazowe",
  use_pass: "Karnet · 1 wejście",
  sport_card: "karta sportowa",
  buy_and_use: "Karnet · 1 wejście",
};

/**
 * The server sends `"unknown"` when a booking's funding cannot be resolved. Rendering it
 * raw leaked the English literal "unknown" into a Polish UI — the chip fell through to
 * the value because this map, unlike the B2B one, never had an entry for it. There is no
 * honest label for "we don't know", so the chip is simply omitted.
 */
function fundingLabel(funding: string | null): string | null {
  if (!funding || funding === "unknown") return null;
  return FUNDING_LABEL[funding] ?? null;
}

/** F4 writes "dziś" / "śr 15 lip" under the time — recency beats a bare date. */
export function relativeDay(date: Date): string {
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(today)) / 86_400_000);
  if (days === 0) return "dziś";
  if (days === 1) return "jutro";
  if (days === -1) return "wczoraj";
  return date.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
}

/**
 * One reservation, in the customer's own list (WY-73).
 *
 * Built on `SessionCardBase`, so it is the same object drawn the same way as the partner's
 * Grafik card and the public schedule card. It used to be a flat row inside one shared
 * bordered container — its docstring claimed it matched "Grafik's session rows", which
 * stopped being true when Grafik was rebuilt on the public card's geometry and this list was
 * left behind. It also drew a chevron and had no click handler at all.
 *
 * The time column shows the time over the *relative day* rather than the duration the other
 * two cards show: this list spans weeks and is grouped only loosely, so "jutro" is the fact a
 * customer scans for. Duration is on the detail screen, where it is actually useful.
 */
export function BookingCard({
  booking,
  onOpen,
}: {
  booking: MyBookingItem;
  onOpen: (booking: MyBookingItem) => void;
}) {
  const isCancelled = booking.status === "cancelled";
  const isPass = booking.funding === "use_pass" || booking.funding === "buy_and_use";
  const start = booking.start_time ? new Date(booking.start_time) : null;
  const label = fundingLabel(booking.funding);

  return (
    <SessionCardBase
      color={booking.color}
      dimmed={booking.is_past || isCancelled}
      struck={isCancelled}
      onClick={() => onOpen(booking)}
      hoverable
      bodyAlign="center"
      time={start ? start.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : "—"}
      timeSub={start ? relativeDay(start) : undefined}
      // Wider and smaller than the schedule cards': this column carries a date, not a
      // duration, and "czw., 27 sie" wraps to two ragged lines at `w-14`/`text-sm`.
      timeColClassName="w-[68px]"
      timeSubClassName="text-[11px] leading-tight"
    >
      <p
        className={cn(
          "truncate text-md font-semibold",
          booking.is_past || isCancelled ? "text-gray-400" : "text-gray-900",
          isCancelled && "line-through",
        )}
      >
        {booking.event_title}
      </p>
      {booking.studio_name && (
        <p className="mt-0.5 truncate text-sm text-gray-500">{booking.studio_name}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {isCancelled && <StatusChip tone="rose">Odwołana</StatusChip>}
        {label && !isCancelled && <StatusChip tone={isPass ? "green" : "gray"}>{label}</StatusChip>}
      </div>
    </SessionCardBase>
  );
}

"use client";

import { ChevronLeft, Mountain } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { StatusChip } from "@/components/b2b/StatusChip";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

import type { MyBookingItem, MyBookingsResponse, MyInquiryItem } from "../types";

const EVENT_TYPE_LABELS: Record<string, string> = {
  retreat: "Wyjazd",
  workshop: "Wydarzenie",
  course: "Kurs",
};

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
function relativeDay(date: Date): string {
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(today)) / 86_400_000);
  if (days === 0) return "dziś";
  if (days === 1) return "jutro";
  if (days === -1) return "wczoraj";
  return date.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A class booking (F4) — time-led, with a coloured left bar, exactly like Grafik's session
 * rows. The two lists describe the same events from opposite sides of the counter, so
 * they should read the same way.
 */
function BookingRow({ booking, dimmed }: { booking: MyBookingItem; dimmed: boolean }) {
  const isPass = booking.funding === "use_pass" || booking.funding === "buy_and_use";
  const start = booking.start_time ? new Date(booking.start_time) : null;
  const label = fundingLabel(booking.funding);

  return (
    <div className={cn("flex items-stretch gap-3 px-4 py-3", dimmed && "opacity-50")}>
      <div className="w-14 shrink-0 pt-0.5 text-right">
        <div className="text-sm font-bold leading-none text-gray-900">
          {start ? start.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : "—"}
        </div>
        {start && (
          <div className="mt-1 text-[11px] leading-none text-gray-400">{relativeDay(start)}</div>
        )}
      </div>

      {/* The bar is what makes a row scannable as "a class" at a glance. */}
      <span className="w-0.5 shrink-0 rounded-full bg-class-green-500" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{booking.event_title}</p>
        {booking.studio_name && (
          <p className="truncate text-xs text-gray-500">{booking.studio_name}</p>
        )}
        {label && (
          <div className="mt-1">
            <StatusChip tone={isPass ? "green" : "gray"}>{label}</StatusChip>
          </div>
        )}
      </div>

      <IoChevronForward className="h-4 w-4 shrink-0 self-center text-gray-300" />
    </div>
  );
}

/**
 * A trip or workshop (F4). Deliberately *not* shaped like a class row: these are
 * inquiries spanning days, so a start time in a gutter would be noise, and the status
 * ("Zapytanie wysłane" vs "Potwierdzone") is the thing being tracked.
 */
function InquiryRow({ inquiry }: { inquiry: MyInquiryItem }) {
  const isConfirmed = inquiry.status === "handled";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-class-sand-500/25 text-class-sand-700">
        <Mountain size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{inquiry.event_title}</p>
        <p className="truncate text-xs text-gray-500">
          {inquiry.event_type ? EVENT_TYPE_LABELS[inquiry.event_type] : null}
        </p>
        <p
          className={cn(
            "mt-0.5 text-xs font-semibold",
            isConfirmed ? "text-b2b-green-text" : "text-b2b-amber-text",
          )}
        >
          {isConfirmed ? "Potwierdzone" : "Zapytanie wysłane"}
        </p>
      </div>
      <IoChevronForward className="h-4 w-4 shrink-0 text-gray-300" />
    </div>
  );
}

/**
 * Merged Rezerwacje pushed screen (spec-b2b §7) — a pushed internal screen, not a
 * tab (B2C has no tab bar). One merged list: `Booking` rows plus the user's own
 * inquiries, minione dimmed.
 */
export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState<MyBookingsResponse | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/account/login?next=${encodeURIComponent("/account/bookings")}`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    axiosInstance
      .get<MyBookingsResponse>("/users/me/bookings")
      .then((r) => setData(r.data))
      .catch(() => setData({ bookings: [], inquiries: [], upcoming_count: 0, inquiry_count: 0 }));
  }, [user]);

  if (loading || !user || !data) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const upcomingClasses = data.bookings.filter(
    (b) => b.event_type === "class" && !b.is_past && b.status !== "cancelled",
  );
  const upcomingTripEvents = data.bookings.filter(
    (b) => b.event_type !== "class" && !b.is_past && b.status !== "cancelled",
  );
  const openInquiries = data.inquiries.filter((i) => !i.is_past);
  const past = data.bookings.filter((b) => b.is_past);

  const isEmpty =
    upcomingClasses.length === 0 &&
    upcomingTripEvents.length === 0 &&
    openInquiries.length === 0 &&
    past.length === 0;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background px-4">
        <button
          onClick={() => router.back()}
          aria-label="Wróć"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="truncate text-xl font-bold text-gray-900">Rezerwacje</h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        {isEmpty && <p className="py-10 text-center text-sm text-gray-400">Brak rezerwacji.</p>}

        {upcomingClasses.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Nadchodzące zajęcia
            </h2>
            <div className="rounded-b2b border bg-white overflow-hidden divide-y">
              {upcomingClasses.map((b) => (
                <BookingRow key={b.booking_id} booking={b} dimmed={false} />
              ))}
            </div>
          </section>
        )}

        {(upcomingTripEvents.length > 0 || openInquiries.length > 0) && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Wyjazdy i wydarzenia
            </h2>
            <div className="rounded-b2b border bg-white overflow-hidden divide-y">
              {upcomingTripEvents.map((b) => (
                <BookingRow key={b.booking_id} booking={b} dimmed={false} />
              ))}
              {openInquiries.map((i) => (
                <InquiryRow key={i.id} inquiry={i} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Minione
            </h2>
            <div className="rounded-b2b border bg-white overflow-hidden divide-y">
              {past.map((b) => (
                <BookingRow key={b.booking_id} booking={b} dimmed />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

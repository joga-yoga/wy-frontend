"use client";

import { ChevronLeft, Mountain } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

import type { MyBookingItem, MyBookingsResponse, MyInquiryItem } from "../types";
import { BookingCard } from "./BookingCard";

const EVENT_TYPE_LABELS: Record<string, string> = {
  retreat: "Wyjazd",
  workshop: "Wydarzenie",
  course: "Kurs",
};

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

  // WY-73: the chevron has been drawn on every row since this screen shipped and did nothing.
  // The detail screen is keyed by booking id, not occurrence id, because a booking is the
  // thing the customer owns — the same session can be booked, cancelled and booked again.
  const openBooking = (booking: MyBookingItem) =>
    router.push(`/account/bookings/${booking.booking_id}`);

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
            <div className="space-y-2">
              {upcomingClasses.map((b) => (
                <BookingCard key={b.booking_id} booking={b} onOpen={openBooking} />
              ))}
            </div>
          </section>
        )}

        {(upcomingTripEvents.length > 0 || openInquiries.length > 0) && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Wyjazdy i wydarzenia
            </h2>
            <div className="space-y-2">
              {upcomingTripEvents.map((b) => (
                <BookingCard key={b.booking_id} booking={b} onOpen={openBooking} />
              ))}
              {openInquiries.length > 0 && (
                <div className="rounded-b2b border bg-white overflow-hidden divide-y">
                  {openInquiries.map((i) => (
                    <InquiryRow key={i.id} inquiry={i} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Minione
            </h2>
            <div className="space-y-2">
              {past.map((b) => (
                <BookingCard key={b.booking_id} booking={b} onOpen={openBooking} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

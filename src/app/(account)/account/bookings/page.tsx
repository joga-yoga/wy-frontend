"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  use_pass: "karnet",
  sport_card: "karta sportowa",
  buy_and_use: "kup i użyj karnetu",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BookingRow({ booking, dimmed }: { booking: MyBookingItem; dimmed: boolean }) {
  const isPass = booking.funding === "use_pass" || booking.funding === "buy_and_use";
  return (
    <div
      className={cn("flex items-center justify-between gap-3 px-4 py-3", dimmed && "opacity-50")}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{booking.event_title}</p>
        <p className="truncate text-xs text-gray-500">
          {booking.start_time && formatDateTime(booking.start_time)}
          {booking.studio_name ? ` · ${booking.studio_name}` : ""}
        </p>
      </div>
      {booking.funding && (
        <StatusChip tone={isPass ? "green" : "gray"} className="shrink-0">
          {isPass ? "Karnet" : (FUNDING_LABEL[booking.funding] ?? booking.funding)}
        </StatusChip>
      )}
    </div>
  );
}

function InquiryRow({ inquiry }: { inquiry: MyInquiryItem }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{inquiry.event_title}</p>
        <p className="truncate text-xs text-gray-500">
          {inquiry.event_type ? EVENT_TYPE_LABELS[inquiry.event_type] : null}
        </p>
      </div>
      <StatusChip tone={inquiry.status === "handled" ? "green" : "amber"} className="shrink-0">
        {inquiry.status === "handled" ? "Potwierdzone" : "Zapytanie wysłane"}
      </StatusChip>
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
      router.replace(`/konto/logowanie?next=${encodeURIComponent("/konto/rezerwacje")}`);
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
      <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background px-4">
        <button
          onClick={() => router.back()}
          aria-label="Wróć"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-900">
          Rezerwacje
        </h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        {isEmpty && <p className="py-10 text-center text-sm text-gray-400">Brak rezerwacji.</p>}

        {upcomingClasses.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Nadchodzące zajęcia
            </h2>
            <div className="rounded-xl border bg-white overflow-hidden divide-y">
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
            <div className="rounded-xl border bg-white overflow-hidden divide-y">
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
            <div className="rounded-xl border bg-white overflow-hidden divide-y">
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

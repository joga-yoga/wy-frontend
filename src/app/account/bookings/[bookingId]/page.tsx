"use client";

import { AlertTriangle, ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { levelLabel } from "@/app/(public)/studio/[slug]/classes/types";
import type { OccurrenceDetail } from "@/app/(public)/studio/[slug]/schedule/types";
import { StatusChip } from "@/components/b2b/StatusChip";
import {
  InstructorSection,
  LocationSection,
  StudioSection,
} from "@/components/session-detail/SessionDetailBlocks";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

/**
 * One reservation, in full (WY-73).
 *
 * The list has drawn a chevron on every row since it shipped and had nothing behind it. This
 * is what it now opens.
 *
 * **Keyed by booking id, not occurrence id**, because a booking is the thing the customer
 * owns — the same session can be booked, cancelled, and booked again, and a URL that survives
 * being shared or refreshed has to name the reservation rather than the class.
 *
 * That costs one extra request: `GET /bookings/{id}` resolves ownership *and* the occurrence,
 * then `GET /public/occurrences/{id}/detail` supplies the session, the instructor, the studio,
 * the location and — since WY-73 — the money and cancellation facts on `viewer_booking`.
 * Loading the detail alone would not do: it answers about the *viewer's* booking on that
 * occurrence, which is the right one here only because the first call proved the booking is
 * theirs and is on this occurrence.
 */

const FUNDING_LABEL: Record<string, string> = {
  drop_in: "Wejście jednorazowe",
  use_pass: "Karnet",
  sport_card: "Karta sportowa",
  buy_and_use: "Karnet (kupiony przy rezerwacji)",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Gotówka na miejscu",
  blik: "BLIK",
  card: "Karta",
  transfer: "Przelew",
  wallet: "Portfel cyfrowy",
  online: "Płatność online",
};

/** `BookingOut` — the subset this screen uses. It is fetched to resolve the occurrence and to
 *  prove ownership, and it doubles as the money source for a **cancelled** booking, which
 *  `viewer_booking` cannot supply: the occurrence-detail endpoint only attaches a booking with
 *  `status == "booked"`, so a cancelled reservation would otherwise lose its payment facts
 *  entirely — exactly when a customer is most likely to be checking what they paid. */
interface BookingSummary {
  id: string;
  occurrence_id: string | null;
  status: string;
  funding_type?: string;
  amount_owed?: number | null;
  sport_card_surcharge?: number | null;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })} o ${d.toLocaleTimeString(
    "pl-PL",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

function formatMoney(amount: number, currency?: string | null): string {
  return `${amount.toFixed(2).replace(".", ",")} ${currency?.toUpperCase() ?? "PLN"}`;
}

/** A labelled fact. The screen is mostly these, so they are one component rather than
 *  a repeated flex row that drifts by a pixel per section. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ReservationDetailContent() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [detail, setDetail] = useState<OccurrenceDetail | null>(null);
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/account/login?next=${encodeURIComponent(`/account/bookings/${params.bookingId}`)}`,
      );
    }
  }, [loading, user, router, params.bookingId]);

  const load = useCallback(async () => {
    try {
      const { data: booking } = await axiosInstance.get<BookingSummary>(
        `/bookings/${params.bookingId}`,
      );
      setSummary(booking);
      if (!booking.occurrence_id) {
        // The schema allows it, and a reservation whose session was deleted still belongs to
        // the customer — showing the little that is left beats a 404 on their own booking.
        setDetail(null);
        return;
      }
      const { data } = await axiosInstance.get<OccurrenceDetail>(
        `/public/occurrences/${booking.occurrence_id}/detail`,
      );
      setDetail(data);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [params.bookingId]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const { data } = await axiosInstance.post<{ was_free: boolean }>(
        `/bookings/${params.bookingId}/cancel`,
      );
      setIsCancelOpen(false);
      // `was_free` comes back from the same dispatch that applied the consequence, so the
      // confirmation cannot claim something different from what actually happened.
      toast({
        description: data.was_free
          ? "Rezerwacja odwołana. Nic nie tracisz."
          : "Rezerwacja odwołana po terminie bezpłatnego odwołania.",
      });
      await load();
    } catch {
      toast({ description: "Nie udało się odwołać rezerwacji.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading || !user || isLoading) {
    return (
      <div className="flex min-h-[100dvh] justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const booking = detail?.viewer_booking ?? null;
  const isCancelled = (summary?.status ?? booking?.status) === "cancelled";

  // `viewer_booking` where it exists, `BookingOut` where it does not — the latter carries no
  // payment method and no paid state, so those simply go missing rather than being guessed.
  const money =
    booking != null
      ? {
          funding: booking.funding_type,
          method: booking.payment_method,
          amount: booking.amount_owed,
          currency: booking.currency,
          surcharge: booking.sport_card_surcharge,
          isPaid: booking.is_paid ?? null,
        }
      : summary != null && summary.amount_owed != null
        ? {
            funding: summary.funding_type,
            method: null,
            amount: summary.amount_owed,
            currency: null,
            surcharge: summary.sport_card_surcharge,
            isPaid: null,
          }
        : null;
  const isPast = detail ? new Date(detail.start_time) < new Date() : false;

  return (
    <div className="min-h-[100dvh] bg-background pb-10">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background px-4">
        <button
          onClick={() => router.push("/account/bookings")}
          aria-label="Wróć"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="truncate text-xl font-bold text-gray-900">Rezerwacja</h1>
      </header>

      <div className="mx-auto max-w-md">
        {notFound || (!detail && !summary) ? (
          <p className="px-4 py-16 text-center text-sm text-gray-400">
            Nie znaleźliśmy tej rezerwacji.
          </p>
        ) : !detail ? (
          <p className="px-4 py-16 text-center text-sm text-gray-400">
            Te zajęcia nie są już dostępne, ale Twoja rezerwacja pozostaje w historii.
          </p>
        ) : (
          <>
            {/* ── 1. The session ───────────────────────────────────────── */}
            <section className="px-4 py-5">
              <div className="flex flex-wrap items-center gap-1.5">
                {isCancelled && <StatusChip tone="rose">Odwołana</StatusChip>}
                {!isCancelled && isPast && <StatusChip tone="gray">Zakończone</StatusChip>}
                {!isCancelled && !isPast && <StatusChip tone="green">Potwierdzona</StatusChip>}
              </div>
              <h2
                className={cn(
                  "mt-2 text-2xl font-bold text-gray-900",
                  isCancelled && "line-through",
                )}
              >
                {detail.template_title}
              </h2>
              <p className="mt-1 text-sm text-gray-600 first-letter:uppercase">
                {formatDateTime(detail.start_time)}
              </p>
              <div className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                <Fact
                  label="Czas trwania"
                  value={detail.duration_minutes ? `${detail.duration_minutes} min` : null}
                />
                <Fact label="Poziom" value={detail.level ? levelLabel(detail.level) : null} />
                <Fact label="Styl" value={detail.style} />
                <Fact label="Sala" value={detail.room_name} />
              </div>
              {detail.important_info && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-sm leading-relaxed text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{detail.important_info}</span>
                </div>
              )}
            </section>

            {/* ── 2. Their reservation ─────────────────────────────────── */}
            {money && (
              <section className="border-t border-gray-100 px-4 py-5">
                <p className="text-[18px] font-semibold text-[#222222]">Twoja rezerwacja</p>
                <div className="mt-2 divide-y divide-gray-100">
                  <Fact
                    label="Sposób opłaty"
                    value={money.funding ? (FUNDING_LABEL[money.funding] ?? null) : null}
                  />
                  <Fact
                    label="Płatność"
                    value={
                      money.method ? (PAYMENT_METHOD_LABEL[money.method] ?? money.method) : null
                    }
                  />
                  <Fact
                    label="Kwota"
                    value={money.amount != null ? formatMoney(money.amount, money.currency) : null}
                  />
                  {money.surcharge != null && money.surcharge > 0 && (
                    <Fact
                      label="Dopłata do karty"
                      value={formatMoney(money.surcharge, money.currency)}
                    />
                  )}
                  <Fact
                    label="Status płatności"
                    value={
                      // Silent on a cancelled booking: `is_paid` is only known from
                      // `viewer_booking`, and inventing "Do zapłaty" for a reservation that no
                      // longer exists would be a debt claim we cannot stand behind.
                      money.isPaid == null || money.amount == null ? null : money.isPaid ? (
                        <span className="text-b2b-green-text">Opłacona</span>
                      ) : (
                        <span className="text-b2b-amber-text">Do zapłaty</span>
                      )
                    }
                  />
                </div>
              </section>
            )}

            {/* ── 3. Instructor / studio / location, 1:1 from the drawer ── */}
            <div className="border-t border-gray-100">
              <InstructorSection detail={detail} showInstructorChange={false} />
            </div>
            <div className="border-t border-gray-100">
              <StudioSection studio={detail.studio} />
            </div>
            <LocationSection detail={detail} />

            {/* ── 4. Cancellation ──────────────────────────────────────── */}
            {booking && !isCancelled && (
              <section className="border-t border-gray-100 px-4 py-5">
                <p className="text-[18px] font-semibold text-[#222222]">Odwołanie</p>
                {booking.cancellation_policy_text && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {booking.cancellation_policy_text}
                  </p>
                )}
                {booking.free_cancellation_deadline && (
                  <p className="mt-1.5 text-sm text-gray-500">
                    Bezpłatnie do {formatDeadline(booking.free_cancellation_deadline)}.
                  </p>
                )}
                {booking.can_cancel ? (
                  <Button
                    variant="outline"
                    size="action"
                    className="mt-4 w-full"
                    onClick={() => setIsCancelOpen(true)}
                  >
                    Odwołaj rezerwację
                  </Button>
                ) : (
                  <p className="mt-4 text-sm text-gray-400">
                    {isPast
                      ? "Te zajęcia już się odbyły — nie można ich odwołać."
                      : "Tej rezerwacji nie można już odwołać."}
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <Drawer open={isCancelOpen} onOpenChange={setIsCancelOpen} showSwipeHandle>
        <DrawerContent>
          <div className="px-4 pb-8 pt-2">
            <DrawerTitle className="text-lg font-bold text-gray-900">
              Odwołać rezerwację?
            </DrawerTitle>
            <DrawerDescription className="mt-2 text-sm leading-relaxed text-gray-600">
              {booking?.cancellation_is_free === false
                ? // The consequence sentence is the studio's real rule, resolved server-side —
                  // the same string shown above, repeated here because this is the moment it
                  // actually costs something.
                  (booking?.cancellation_policy_text ??
                  "Odwołanie po terminie może wiązać się z kosztem.")
                : "Możesz odwołać tę rezerwację bez konsekwencji."}
            </DrawerDescription>
            <Button
              variant="destructive"
              size="action"
              className="mt-6 w-full"
              disabled={isCancelling}
              onClick={handleCancel}
            >
              {isCancelling ? "Odwoływanie..." : "Tak, odwołaj"}
            </Button>
            <DrawerClose className="mt-3 w-full py-2 text-sm text-gray-500">
              Zostawiam rezerwację
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/**
 * `useParams` is uncached data, and Next 16 refuses to prerender a route that reads it outside
 * a Suspense boundary. `/account/partner` gets one from its layout; `/account/bookings` has no
 * layout of its own, so the boundary lives here — the same shape `/platnosc/powrot` and
 * `/account/auth/verify-email` already use.
 */
export default function ReservationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ReservationDetailContent />
    </Suspense>
  );
}

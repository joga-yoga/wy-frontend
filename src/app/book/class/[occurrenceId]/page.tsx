"use client";

import { Banknote, Check, ShoppingBag, Ticket, Wallet } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import type { OccurrenceDetail } from "@/app/(public)/studio/[slug]/schedule/types";
import { BlockedState } from "@/components/booking/BlockedState";
import { CancellationChip } from "@/components/booking/CancellationChip";
import { OccurrenceHero } from "@/components/booking/OccurrenceHero";
import { OptionRadio, OptionRow, OwnTag } from "@/components/booking/OptionRow";
import { PickedOptionRow } from "@/components/booking/PickedOptionRow";
import { SportCardLogo } from "@/components/booking/SportCardLogo";
import {
  formatMoney,
  LightPassTile,
  perEntry,
} from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { downloadIcs } from "@/lib/generateIcs";
import { cn } from "@/lib/utils";

import { BuyPassDrawer } from "./BuyPassDrawer";
import { CheckoutNav } from "./CheckoutNav";
import { PaymentMethodSection } from "./PaymentMethodSection";
import { SportCardDrawer } from "./SportCardDrawer";
import {
  type BookingDrawer,
  type BookingOptionsResponse,
  type BookingOut,
  type BookingScreen,
  buyAndUseAsStudioPass,
  type ExistingPassOption,
  type FundingSelection,
  isMethodFundingSelection,
  skipsMethodScreen,
  toBookingCreateRequest,
} from "./types";

// ── Formatting helpers ────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  const timePart = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} o ${timePart}`;
}

function extractErrorDetail(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || fallback;
}

function pluralKarnetow(n: number): string {
  if (n === 1) return "1 karnet";
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return `${n} karnety`;
  return `${n} karnetów`;
}

function passSubtitle(pass: ExistingPassOption, selected: boolean): string {
  const validPart = pass.valid_until ? ` · ważny do ${formatShortDate(pass.valid_until)}` : "";
  if (pass.entries_remaining == null) {
    return selected ? "Bez limitu wejść" : `Bez limitu wejść${validPart}`;
  }
  if (selected) {
    return `Po rezerwacji zostaną ${pass.entries_remaining - 1} wejścia`;
  }
  return `Zostały ${pass.entries_remaining} wejścia${validPart}`;
}

// ── Right-slot primitives (price stacked over radio, matches drawer `.pright`) ────────

function PriceRadioSlot({
  price,
  selected,
  accent,
}: {
  price: string;
  selected: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span
        className={cn("text-base font-bold", accent ? "text-brand-green-700" : "text-gray-900")}
      >
        {price}
      </span>
      <OptionRadio selected={selected} />
    </div>
  );
}

function Chevron() {
  return <IoChevronForward className="h-5 w-5 text-gray-400" />;
}

function checkoutCtaCopy(selection: FundingSelection | null, currency?: string | null) {
  if (!selection) {
    return {
      label: "Wybierz sposób płatności",
      receipt: null,
      disabled: true,
      icon: "cash" as const,
    };
  }

  switch (selection.kind) {
    case "use_pass":
      return {
        label: "Zarezerwuj z karnetu",
        receipt: "Zapłacisz karnetem — wykorzystasz 1 wejście",
        disabled: false,
        icon: "wallet" as const,
      };
    case "drop_in": {
      const amount = formatMoney(selection.price, currency);
      return {
        label: `Zarezerwuj · ${amount}`,
        receipt: `${amount} · płatność gotówką na miejscu`,
        disabled: false,
        icon: "cash" as const,
      };
    }
    case "buy_and_use": {
      const amount = formatMoney(selection.price, selection.currency);
      return {
        label: "Kup karnet i zarezerwuj",
        receipt: `${amount} za karnet · płatność gotówką na miejscu`,
        disabled: false,
        icon: "wallet" as const,
      };
    }
    case "sport_card":
      if (!selection.fee || selection.fee <= 0) {
        return {
          label: "Zarezerwuj",
          receipt: "Bez dopłaty · sprawdzimy kartę w studiu",
          disabled: false,
          icon: "wallet" as const,
        };
      }
      return {
        label: "Zarezerwuj",
        receipt: `dopłata ${formatMoney(selection.fee, currency)} · płatność gotówką na miejscu`,
        disabled: false,
        icon: "cash" as const,
      };
  }
}

// ── Funding screen (§3) ─────────────────────────────────────────────────

function FundingScreen({
  detail,
  options,
  selection,
  onSelect,
  onOpenDrawer,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  detail: OccurrenceDetail;
  options: BookingOptionsResponse;
  selection: FundingSelection | null;
  onSelect: (selection: FundingSelection) => void;
  onOpenDrawer: (drawer: BookingDrawer) => void;
  onSubmit: (selection: FundingSelection) => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const currency = options.currency;
  const [expanded, setExpanded] = useState(() => options.existing_passes.length === 0);

  const buyAndUsePerEntries = options.buy_and_use_options
    .map((o) => perEntry(buyAndUseAsStudioPass(o)))
    .filter((v): v is number => v != null);
  const minPerEntry = buyAndUsePerEntries.length > 0 ? Math.min(...buyAndUsePerEntries) : null;

  const pickedBuyPass =
    selection?.kind === "buy_and_use"
      ? (options.buy_and_use_options.find((option) => option.pass_id === selection.passId) ?? null)
      : null;
  const pickedSportCard =
    selection?.kind === "sport_card"
      ? (options.sport_card_options.find(
          (option) => option.studio_sport_card_id === selection.studioSportCardId,
        ) ?? null)
      : null;
  const showFullFundingList = expanded || options.existing_passes.length === 0;
  const ctaCopy = checkoutCtaCopy(selection, currency);

  useEffect(() => {
    if (selection || options.existing_passes.length === 0) return;
    const pass = options.existing_passes[0];
    onSelect({
      kind: "use_pass",
      userPassId: pass.user_pass_id,
      passName: pass.pass_name,
      entriesRemaining: pass.entries_remaining ?? null,
    });
  }, [onSelect, options.existing_passes, selection]);

  return (
    <div className="mx-auto max-w-md p-4 pb-8">
      <CheckoutNav studioSlug={detail.studio.slug} />

      <OccurrenceHero
        title={detail.template_title}
        calendarDate={detail.calendar_date}
        startTime={detail.start_time}
        endTime={detail.end_time}
        durationMinutes={detail.duration_minutes}
        color={detail.color}
        instructor={
          detail.instructor
            ? {
                id: detail.instructor.id,
                name: detail.instructor.name,
                imageId: detail.instructor.image_id,
              }
            : null
        }
      />

      <div className="mt-3">
        <CancellationChip deadline={options.free_cancellation_deadline} />
      </div>

      <h1 className="mt-6 text-xl font-extrabold text-gray-900">Jak chcesz zapłacić?</h1>
      <p className="mt-1.5 text-sm text-gray-500">Miejsce rezerwujemy od razu.</p>

      <div className="mt-5 space-y-2">
        {options.existing_passes.map((pass) => {
          const isSelected =
            selection?.kind === "use_pass" && selection.userPassId === pass.user_pass_id;
          return (
            <OptionRow
              key={pass.user_pass_id}
              icon={<Wallet className="h-5 w-5 text-gray-700" />}
              title={
                <>
                  {pass.pass_name}
                  <OwnTag />
                </>
              }
              subtitle={passSubtitle(pass, isSelected)}
              right={<OptionRadio selected={isSelected} />}
              selected={isSelected}
              onClick={() =>
                onSelect({
                  kind: "use_pass",
                  userPassId: pass.user_pass_id,
                  passName: pass.pass_name,
                  entriesRemaining: pass.entries_remaining ?? null,
                })
              }
            />
          );
        })}

        {!showFullFundingList && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-between rounded-2xl border-[1.5px] border-gray-200 bg-white px-4 py-3.5 text-left text-[15px] font-bold text-gray-900 transition-colors"
          >
            <span>Więcej opcji płatności</span>
            <IoChevronForward className="h-5 w-5 text-gray-400" />
          </button>
        )}

        {showFullFundingList && (
          <>
            {options.drop_in_price != null && (
              <OptionRow
                icon={<Ticket className="h-5 w-5 text-gray-700" />}
                title="Pojedyncze wejście"
                subtitle="Bez karnetu"
                right={
                  <PriceRadioSlot
                    price={formatMoney(options.drop_in_price, currency)}
                    selected={selection?.kind === "drop_in"}
                  />
                }
                selected={selection?.kind === "drop_in"}
                onClick={() => onSelect({ kind: "drop_in", price: options.drop_in_price! })}
              />
            )}

            {options.buy_and_use_options.length > 0 &&
              (selection?.kind === "buy_and_use" ? (
                <PickedOptionRow
                  left={
                    <LightPassTile
                      size={44}
                      sessionCount={pickedBuyPass?.session_count}
                      durationDays={pickedBuyPass?.duration_days}
                    />
                  }
                  kicker="Kupujesz karnet"
                  name={selection.passName}
                  sub={`${
                    pickedBuyPass && perEntry(buyAndUseAsStudioPass(pickedBuyPass)) != null
                      ? `${formatMoney(
                          perEntry(buyAndUseAsStudioPass(pickedBuyPass)),
                          selection.currency,
                        )}/wejście`
                      : "bez limitu wejść"
                  } · pierwsze wejście na te zajęcia`}
                  price={formatMoney(selection.price, selection.currency)}
                  onChange={() => onOpenDrawer("buy-pass")}
                />
              ) : (
                <OptionRow
                  icon={<ShoppingBag className="h-5 w-5 text-gray-700" />}
                  title="Kup karnet"
                  subtitle={
                    minPerEntry != null
                      ? `Od ${formatMoney(minPerEntry, currency)}/wejście · ${pluralKarnetow(options.buy_and_use_options.length)}`
                      : pluralKarnetow(options.buy_and_use_options.length)
                  }
                  right={<Chevron />}
                  selected={false}
                  onClick={() => onOpenDrawer("buy-pass")}
                />
              ))}

            {options.accepts_sport_cards &&
              options.sport_card_options.length > 0 &&
              (selection?.kind === "sport_card" ? (
                <PickedOptionRow
                  left={
                    <SportCardLogo
                      photo={pickedSportCard?.photo}
                      alt={selection.cardName}
                      width={44}
                      height={28}
                      // className="rounded-[4px]"
                      // width = 52,
                      // height = 34,
                    />
                  }
                  kicker="Karta sportowa"
                  name={selection.cardName}
                  sub="Sprawdzimy kartę w studiu"
                  price={
                    selection.fee && selection.fee > 0
                      ? `dopłata ${formatMoney(selection.fee, currency)}`
                      : "bez dopłaty"
                  }
                  priceAccent={!selection.fee || selection.fee <= 0}
                  onChange={() => onOpenDrawer("sport-card")}
                />
              ) : (
                <OptionRow
                  icon={<Wallet className="h-5 w-5 text-gray-700" />}
                  title="Karta sportowa"
                  subtitle="MultiSport, Medicover i inne"
                  right={<Chevron />}
                  selected={false}
                  onClick={() => onOpenDrawer("sport-card")}
                />
              ))}
          </>
        )}
      </div>

      {isMethodFundingSelection(selection) && !skipsMethodScreen(selection) && (
        <PaymentMethodSection studio={detail.studio} />
      )}

      {submitError && <p className="mt-4 text-sm text-destructive">{submitError}</p>}

      <div className="mt-6">
        {ctaCopy.receipt && (
          <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">
            {ctaCopy.icon === "wallet" ? (
              <Wallet className="h-[18px] w-[18px] shrink-0 text-brand-green-700" />
            ) : (
              <Banknote className="h-[18px] w-[18px] shrink-0 text-brand-green-700" />
            )}
            <span>{ctaCopy.receipt}</span>
          </div>
        )}
        <Button
          className="w-full"
          style={!ctaCopy.disabled ? { background: "#4F8A62" } : undefined}
          variant={ctaCopy.disabled ? "secondary" : undefined}
          size="cta"
          disabled={ctaCopy.disabled || isSubmitting}
          onClick={() => {
            if (selection) onSubmit(selection);
          }}
        >
          {isSubmitting ? "Rezerwuję..." : ctaCopy.label}
        </Button>
      </div>
    </div>
  );
}

// ── Confirmation screen (§6) ─────────────────────────────────────────────

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={cn("text-sm font-semibold text-gray-900", valueClassName)}>{value}</span>
    </div>
  );
}

function ConfirmationScreen({
  booking,
  selection,
  detail,
  currency,
}: {
  booking: BookingOut;
  selection: FundingSelection | null;
  detail: OccurrenceDetail;
  currency?: string | null;
}) {
  const router = useRouter();
  const owesCash = !!booking.amount_owed && booking.amount_owed > 0;

  const subtitle = owesCash
    ? "Twoje miejsce jest zaklepane. Zapłać w studiu przed zajęciami."
    : "Twoje miejsce jest zaklepane. Do zobaczenia na macie.";

  // Row labels/branching use BookingOut (the real response) as source of truth; item *names*
  // (which pass/card) aren't on BookingOut, so those still come from the pre-submit selection —
  // both paths (immediate-submit from Funding, or via Method) leave `fundingSelection` populated.
  const paymentRow = (() => {
    if (booking.funding_type === "use_pass") {
      const passName = selection?.kind === "use_pass" ? selection.passName : "Karnet";
      return { label: "Płatność", value: `${passName} · 1 wejście` };
    }
    if (booking.funding_type === "sport_card") {
      const fee = booking.sport_card_surcharge ?? booking.amount_owed;
      return fee && fee > 0
        ? { label: "Dopłata", value: `${formatMoney(fee, currency)} · gotówką` }
        : { label: "Dopłata", value: "bez dopłaty" };
    }
    // drop_in / buy_and_use — amount_owed already carries the full amount for buy_and_use.
    return {
      label: "Do zapłaty na miejscu",
      value: `${formatMoney(booking.amount_owed, currency)} · gotówką`,
    };
  })();

  const deadline = booking.free_cancellation_deadline;

  const payNote = owesCash
    ? `Zapłać ${formatMoney(booking.amount_owed, currency)} gotówką w recepcji przed zajęciami. Miejsce trzymamy dla Ciebie.`
    : selection?.kind === "use_pass"
      ? selection.entriesRemaining == null
        ? "Wykorzystano 1 wejście z karnetu. Karnet bez limitu wejść."
        : `Wykorzystano 1 wejście z karnetu. Zostały ${selection.entriesRemaining - 1} wejścia.`
      : "Rezerwacja opłacona kartą sportową — bez dopłaty.";

  function handleAddToCalendar() {
    downloadIcs({
      uid: `${booking.id}@wy`,
      title: detail.template_title,
      startTime: detail.start_time,
      endTime: detail.end_time,
      location: detail.studio.name,
    });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-700/10">
        <Check className="h-7 w-7 text-brand-green-700" />
      </div>
      <h1 className="mt-4 text-2xl font-extrabold text-gray-900">Zarezerwowane!</h1>
      <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>

      <OccurrenceHero
        title={detail.template_title}
        calendarDate={detail.calendar_date}
        startTime={detail.start_time}
        endTime={detail.end_time}
        durationMinutes={detail.duration_minutes}
        color={detail.color}
        compact
        className="mt-6 text-left"
      />

      <div className="mt-2 divide-y divide-gray-100 text-left">
        {detail.instructor && <DetailRow label="Instruktor" value={detail.instructor.name} />}
        <DetailRow label={paymentRow.label} value={paymentRow.value} />
        <DetailRow
          label="Bezpłatne odwołanie"
          value={deadline ? formatDeadline(deadline) : "w dowolnym momencie"}
          valueClassName={deadline ? "text-brand-green-700" : undefined}
        />
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-left text-sm text-gray-600">
        {payNote}
      </div>

      <div className="mt-6 space-y-2.5">
        <Button variant="outline" className="w-full" size="cta" onClick={handleAddToCalendar}>
          Dodaj do kalendarza
        </Button>
        <Button
          className="w-full text-white"
          style={{ background: "#1a1a1a" }}
          size="cta"
          onClick={() =>
            router.push(detail.studio.slug ? `/studio/${detail.studio.slug}/schedule` : "/")
          }
        >
          Wróć do grafiku
        </Button>
      </div>
    </div>
  );
}

// ── Root content ─────────────────────────────────────────────────────

function BookClassContent() {
  const { occurrenceId } = useParams<{ occurrenceId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [screen, setScreen] = useState<BookingScreen>("checkout");
  const [drawer, setDrawer] = useState<BookingDrawer>(null);
  const [fundingSelection, setFundingSelection] = useState<FundingSelection | null>(null);

  const [detail, setDetail] = useState<OccurrenceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [options, setOptions] = useState<BookingOptionsResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingOut | null>(null);

  useEffect(() => {
    if (authLoading || user) return;
    router.replace(`/account/login?next=${encodeURIComponent(pathname)}`);
  }, [authLoading, user, router, pathname]);

  useEffect(() => {
    if (!occurrenceId) return;
    setDetailLoading(true);
    axiosInstance
      .get<OccurrenceDetail>(`/public/occurrences/${occurrenceId}/detail`)
      .then((r) => setDetail(r.data))
      .catch(() => setDetailError("Nie udało się wczytać szczegółów zajęć."))
      .finally(() => setDetailLoading(false));
  }, [occurrenceId]);

  useEffect(() => {
    if (!user || !occurrenceId) return;
    setOptionsLoading(true);
    axiosInstance
      .get<BookingOptionsResponse>(`/occurrences/${occurrenceId}/booking-options`)
      .then((r) => setOptions(r.data))
      .catch((err) =>
        setOptionsError(extractErrorDetail(err, "Nie udało się wczytać opcji rezerwacji.")),
      )
      .finally(() => setOptionsLoading(false));
  }, [user, occurrenceId]);

  async function submitBooking(selection: FundingSelection) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await axiosInstance.post<BookingOut>(
        `/occurrences/${occurrenceId}/bookings`,
        toBookingCreateRequest(selection),
      );
      setBooking(data);
      setScreen("confirmation");
    } catch (err) {
      setSubmitError(extractErrorDetail(err, "Nie udało się zarezerwować zajęć."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Ładowanie...
      </div>
    );
  }

  if (detailLoading || optionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Ładowanie...
      </div>
    );
  }

  if (detailError || optionsError || !detail || !options) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-destructive">
        {detailError || optionsError || "Nie znaleziono zajęć."}
      </div>
    );
  }

  if (!options.seat_available) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-sm text-gray-700">Brak wolnych miejsc — wybierz inne zajęcia.</p>
        <Button className="mt-6" variant="outline" onClick={() => router.back()}>
          Wróć
        </Button>
      </div>
    );
  }

  if (screen === "confirmation" && booking) {
    return (
      <ConfirmationScreen
        booking={booking}
        selection={fundingSelection}
        detail={detail}
        currency={options.currency}
      />
    );
  }

  // §7.1 — studio has no usable payment method at all (accepts_cash false, accepts_stripe false;
  // accepts_bank_transfer is out of this UI's scope per T04's decision). Existing passes would
  // still be redeemable in principle, but the brief's edge-case screen blocks the whole funding
  // list here — treated as a deliberate studio-level "not bookable online yet" gate, not just a
  // cash-dependent-rows gate.
  const noPaymentMethods = !detail.studio.accepts_cash && !detail.studio.accepts_stripe;

  // §7.2 — no usable funding option at all, i.e. every Funding-screen row would be hidden (same
  // conditions FundingScreen itself uses to decide row visibility, reused here rather than
  // re-derived).
  const noUsableFunding =
    options.existing_passes.length === 0 &&
    options.drop_in_price == null &&
    options.buy_and_use_options.length === 0 &&
    !(options.accepts_sport_cards && options.sport_card_options.length > 0);

  const contactHref = detail.studio.slug ? `/studio/${detail.studio.slug}` : null;

  if (noPaymentMethods) {
    return (
      <BlockedState
        title="Rezerwacja online niedostępna"
        body="To studio nie udostępniło jeszcze płatności online. Zarezerwuj miejsce bezpośrednio w studiu."
        contactHref={contactHref}
      />
    );
  }

  if (noUsableFunding) {
    return (
      <BlockedState
        title="Rezerwacja niedostępna"
        body="To studio nie udostępniło jeszcze żadnej metody płatności dla tych zajęć. Zarezerwuj miejsce bezpośrednio w studiu."
        contactHref={contactHref}
      />
    );
  }

  return (
    <>
      <FundingScreen
        detail={detail}
        options={options}
        selection={fundingSelection}
        onSelect={setFundingSelection}
        onOpenDrawer={setDrawer}
        onSubmit={submitBooking}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
      <BuyPassDrawer
        open={drawer === "buy-pass"}
        options={options.buy_and_use_options}
        dropInPrice={options.drop_in_price}
        currency={options.currency}
        selectedPassId={fundingSelection?.kind === "buy_and_use" ? fundingSelection.passId : null}
        onClose={() => setDrawer(null)}
        onConfirm={(selection) => {
          setFundingSelection(selection);
          setDrawer(null);
        }}
      />
      <SportCardDrawer
        open={drawer === "sport-card"}
        options={options.sport_card_options}
        currency={options.currency}
        selectedSportCardId={
          fundingSelection?.kind === "sport_card" ? fundingSelection.studioSportCardId : null
        }
        onClose={() => setDrawer(null)}
        onConfirm={(selection) => {
          setFundingSelection(selection);
          setDrawer(null);
        }}
      />
    </>
  );
}

export default function BookClassPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
          Ładowanie...
        </div>
      }
    >
      <BookClassContent />
    </Suspense>
  );
}

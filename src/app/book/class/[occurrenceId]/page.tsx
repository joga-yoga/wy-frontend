"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";

import type {
  BookingCreateRequest,
  BookingOptionsResponse,
  BookingOut,
  FundingType,
} from "./types";

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  const timePart = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} o ${timePart}`;
}

const FUNDING_LABELS: Record<FundingType, string> = {
  use_pass: "Mój karnet",
  drop_in: "Wejście jednorazowe",
  sport_card: "Karta sportowa",
  buy_and_use: "Kup karnet",
};

function OptionRow({
  label,
  detail,
  isSelected,
  onClick,
}: {
  label: string;
  detail: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm",
        isSelected
          ? "border-brand-green font-semibold text-foreground"
          : "border-border text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className="text-xs">{detail}</span>
    </button>
  );
}

function BookClassContent() {
  const { occurrenceId } = useParams<{ occurrenceId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [options, setOptions] = useState<BookingOptionsResponse | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fundingType, setFundingType] = useState<FundingType | undefined>(undefined);
  const [selectedUserPassId, setSelectedUserPassId] = useState<string | null>(null);
  const [selectedSportCardId, setSelectedSportCardId] = useState<string | null>(null);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingOut | null>(null);

  useEffect(() => {
    if (authLoading || user) return;
    router.replace(`/profile/login?next=${encodeURIComponent(pathname)}`);
  }, [authLoading, user, router, pathname]);

  useEffect(() => {
    if (!user || !occurrenceId) return;
    setIsLoadingOptions(true);
    axiosInstance
      .get<BookingOptionsResponse>(`/occurrences/${occurrenceId}/booking-options`)
      .then((r) => {
        setOptions(r.data);
        // The cheapest applicable existing pass is already sorted first by the backend —
        // preselecting it surfaces it prominently, per the brief's requirement.
        if (r.data.existing_passes.length > 0) {
          setFundingType("use_pass");
          setSelectedUserPassId(r.data.existing_passes[0].user_pass_id);
        } else if (r.data.drop_in_price != null) {
          setFundingType("drop_in");
        } else if (r.data.accepts_sport_cards && r.data.sport_card_options.length > 0) {
          setFundingType("sport_card");
          setSelectedSportCardId(r.data.sport_card_options[0].studio_sport_card_id);
        } else if (r.data.buy_and_use_options.length > 0) {
          setFundingType("buy_and_use");
          setSelectedPassId(r.data.buy_and_use_options[0].pass_id);
        }
      })
      .catch((err) => {
        setLoadError(err?.response?.data?.detail || "Nie udało się wczytać opcji rezerwacji.");
      })
      .finally(() => setIsLoadingOptions(false));
  }, [user, occurrenceId]);

  const availableFundingTypes = useMemo<FundingType[]>(() => {
    if (!options) return [];
    const types: FundingType[] = [];
    if (options.existing_passes.length > 0) types.push("use_pass");
    if (options.drop_in_price != null) types.push("drop_in");
    if (options.accepts_sport_cards && options.sport_card_options.length > 0) {
      types.push("sport_card");
    }
    if (options.buy_and_use_options.length > 0) types.push("buy_and_use");
    return types;
  }, [options]);

  function handleFundingTypeChange(next: FundingType) {
    setFundingType(next);
    if (!options) return;
    if (next === "use_pass" && options.existing_passes.length > 0) {
      setSelectedUserPassId(options.existing_passes[0].user_pass_id);
    } else if (next === "sport_card" && options.sport_card_options.length > 0) {
      setSelectedSportCardId(options.sport_card_options[0].studio_sport_card_id);
    } else if (next === "buy_and_use" && options.buy_and_use_options.length > 0) {
      setSelectedPassId(options.buy_and_use_options[0].pass_id);
    }
  }

  async function handleSubmit() {
    if (!fundingType) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const payload: BookingCreateRequest = { funding_type: fundingType };
    if (fundingType === "use_pass") payload.user_pass_id = selectedUserPassId ?? undefined;
    if (fundingType === "sport_card")
      payload.studio_sport_card_id = selectedSportCardId ?? undefined;
    if (fundingType === "buy_and_use") payload.pass_id = selectedPassId ?? undefined;

    try {
      const { data } = await axiosInstance.post<BookingOut>(
        `/occurrences/${occurrenceId}/bookings`,
        payload,
      );
      setBooking(data);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.detail || "Nie udało się zarezerwować zajęć.");
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

  if (booking) {
    const currency = options?.currency || "PLN";
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Rezerwacja potwierdzona</h1>
        <p className="mb-6 text-sm text-gray-600">Twoje miejsce zostało zarezerwowane.</p>
        {booking.amount_owed != null && (
          <div className="mb-4 rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Do zapłaty na miejscu: {booking.amount_owed.toLocaleString("pl-PL")}{" "}
            {getCurrencySymbol(currency)}
          </div>
        )}
        {booking.free_cancellation_deadline && (
          <p className="text-xs text-gray-500">
            Bezpłatne odwołanie do {formatDeadline(booking.free_cancellation_deadline)}.
          </p>
        )}
        <Button
          className="mt-6 w-full"
          variant="cta"
          size="cta"
          onClick={() => router.push("/profile")}
        >
          Wróć do profilu
        </Button>
      </div>
    );
  }

  if (isLoadingOptions) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Ładowanie...
      </div>
    );
  }

  if (loadError || !options) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-destructive">
        {loadError || "Nie znaleziono zajęć."}
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

  const currency = options.currency || "PLN";

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Wybierz sposób płatności</h1>

      <SegmentedToggle
        columns={Math.min(availableFundingTypes.length, 2)}
        value={fundingType}
        onChange={handleFundingTypeChange}
        options={availableFundingTypes.map((type) => ({
          label: FUNDING_LABELS[type],
          value: type,
        }))}
      />

      {fundingType === "drop_in" && options.drop_in_price != null && (
        <div className="mt-4 rounded-lg border px-4 py-3 text-sm text-gray-700">
          Cena: {options.drop_in_price.toLocaleString("pl-PL")} {getCurrencySymbol(currency)}
        </div>
      )}

      {fundingType === "use_pass" && options.existing_passes.length > 0 && (
        <div className="mt-4 space-y-2">
          {options.existing_passes.map((pass) => (
            <OptionRow
              key={pass.user_pass_id}
              label={pass.pass_name}
              detail={pass.entries_remaining != null ? `${pass.entries_remaining} wejść` : "∞"}
              isSelected={selectedUserPassId === pass.user_pass_id}
              onClick={() => setSelectedUserPassId(pass.user_pass_id)}
            />
          ))}
        </div>
      )}

      {fundingType === "sport_card" && options.sport_card_options.length > 0 && (
        <div className="mt-4 space-y-2">
          {options.sport_card_options.map((card) => (
            <OptionRow
              key={card.studio_sport_card_id}
              label={card.name || "Karta sportowa"}
              detail={
                card.fee
                  ? `+${card.fee.toLocaleString("pl-PL")} ${getCurrencySymbol(currency)}`
                  : "bez dopłaty"
              }
              isSelected={selectedSportCardId === card.studio_sport_card_id}
              onClick={() => setSelectedSportCardId(card.studio_sport_card_id)}
            />
          ))}
        </div>
      )}

      {fundingType === "buy_and_use" && options.buy_and_use_options.length > 0 && (
        <div className="mt-4 space-y-2">
          {options.buy_and_use_options.map((pass) => (
            <OptionRow
              key={pass.pass_id}
              label={pass.name}
              detail={`${pass.price.toLocaleString("pl-PL")} ${getCurrencySymbol(pass.currency || currency)}`}
              isSelected={selectedPassId === pass.pass_id}
              onClick={() => setSelectedPassId(pass.pass_id)}
            />
          ))}
        </div>
      )}

      {options.free_cancellation_deadline && (
        <p className="mt-4 text-xs text-gray-500">
          Bezpłatne odwołanie do {formatDeadline(options.free_cancellation_deadline)}.
        </p>
      )}

      {submitError && <p className="mt-4 text-sm text-destructive">{submitError}</p>}

      <Button
        className="mt-6 w-full"
        variant="cta"
        size="cta"
        disabled={!fundingType || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? "Rezerwuję..." : "Zarezerwuj"}
      </Button>
    </div>
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

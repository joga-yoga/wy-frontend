"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type {
  BookingOptionsResponse,
  BuyAndUsePassOption,
  ExistingPassOption,
  SportCardOption,
} from "@/app/book/class/[occurrenceId]/types";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { RosterRow } from "../components/RosterRow";
import type { FundingType, RosterEntry, WalkInUserLookupResponse } from "../types";

const FUNDING_LABELS: Record<FundingType, string> = {
  use_pass: "Karnet klienta",
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

export default function FrontDeskRosterPage() {
  const { studioId, occurrenceId } = useParams<{ studioId: string; occurrenceId: string }>();

  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);

  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [walkInCustomer, setWalkInCustomer] = useState<WalkInUserLookupResponse | null>(null);

  const [options, setOptions] = useState<BookingOptionsResponse | null>(null);
  const [fundingType, setFundingType] = useState<FundingType | undefined>(undefined);
  const [selectedUserPassId, setSelectedUserPassId] = useState<string | null>(null);
  const [selectedSportCardId, setSelectedSportCardId] = useState<string | null>(null);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  const fetchRoster = useCallback(() => {
    axiosInstance
      .get<RosterEntry[]>(`/occurrences/${occurrenceId}/roster`)
      .then((r) => setRoster(r.data))
      .catch(() => setRoster([]));
  }, [occurrenceId]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  async function runAction(bookingId: string, action: string) {
    setBusyBookingId(bookingId);
    try {
      await axiosInstance.post(`/bookings/${bookingId}/${action}`);
      fetchRoster();
    } finally {
      setBusyBookingId(null);
    }
  }

  async function handleLookup() {
    setIsLookingUp(true);
    setLookupError(null);
    try {
      const { data } = await axiosInstance.get<WalkInUserLookupResponse>(
        `/studios/${studioId}/front-desk/lookup-user`,
        { params: { email } },
      );
      setWalkInCustomer(data);
      const { data: opts } = await axiosInstance.get<BookingOptionsResponse>(
        `/studios/${studioId}/occurrences/${occurrenceId}/walk-in-options`,
        { params: { user_id: data.user_id } },
      );
      setOptions(opts);
      if (opts.existing_passes.length > 0) {
        setFundingType("use_pass");
        setSelectedUserPassId(opts.existing_passes[0].user_pass_id);
      } else if (opts.drop_in_price != null) {
        setFundingType("drop_in");
      } else if (opts.accepts_sport_cards && opts.sport_card_options.length > 0) {
        setFundingType("sport_card");
        setSelectedSportCardId(opts.sport_card_options[0].studio_sport_card_id);
      } else if (opts.buy_and_use_options.length > 0) {
        setFundingType("buy_and_use");
        setSelectedPassId(opts.buy_and_use_options[0].pass_id);
      }
    } catch (err: any) {
      setLookupError(
        err?.response?.data?.detail || "Nie znaleziono użytkownika o tym adresie e-mail.",
      );
      setWalkInCustomer(null);
      setOptions(null);
    } finally {
      setIsLookingUp(false);
    }
  }

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

  async function handleWalkInSubmit() {
    if (!walkInCustomer || !fundingType) return;
    setIsSubmittingWalkIn(true);
    setWalkInError(null);
    try {
      await axiosInstance.post(`/studios/${studioId}/occurrences/${occurrenceId}/walk-in`, {
        user_id: walkInCustomer.user_id,
        funding_type: fundingType,
        user_pass_id: fundingType === "use_pass" ? selectedUserPassId : undefined,
        studio_sport_card_id: fundingType === "sport_card" ? selectedSportCardId : undefined,
        pass_id: fundingType === "buy_and_use" ? selectedPassId : undefined,
      });
      fetchRoster();
      setIsWalkInOpen(false);
      setEmail("");
      setWalkInCustomer(null);
      setOptions(null);
      setFundingType(undefined);
    } catch (err: any) {
      setWalkInError(err?.response?.data?.detail || "Nie udało się dodać uczestnika.");
    } finally {
      setIsSubmittingWalkIn(false);
    }
  }

  const availableFundingTypes: FundingType[] = options
    ? [
        ...(options.existing_passes.length > 0 ? (["use_pass"] as const) : []),
        ...(options.drop_in_price != null ? (["drop_in"] as const) : []),
        ...(options.accepts_sport_cards && options.sport_card_options.length > 0
          ? (["sport_card"] as const)
          : []),
        ...(options.buy_and_use_options.length > 0 ? (["buy_and_use"] as const) : []),
      ]
    : [];

  const currency = options?.currency || "PLN";

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Lista obecności</h1>

      {roster === null ? (
        <p className="py-8 text-center text-sm text-gray-400">Ładowanie...</p>
      ) : roster.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Brak rezerwacji na te zajęcia.</p>
      ) : (
        <div className="space-y-2">
          {roster.map((entry) => (
            <RosterRow
              key={entry.booking_id}
              entry={entry}
              isBusy={busyBookingId === entry.booking_id}
              onMarkPaid={() => runAction(entry.booking_id, "mark-paid")}
              onMarkCardOk={() => runAction(entry.booking_id, "mark-card-ok")}
              onMarkAttended={() => runAction(entry.booking_id, "mark-attended")}
              onMarkNoShow={() => runAction(entry.booking_id, "mark-no-show")}
              onCorrectNoShow={() => runAction(entry.booking_id, "correct-no-show")}
            />
          ))}
        </div>
      )}

      <div className="mt-6 border-t pt-6">
        {!isWalkInOpen ? (
          <Button variant="outline" className="w-full" onClick={() => setIsWalkInOpen(true)}>
            Dodaj uczestnika (walk-in)
          </Button>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Nowy uczestnik</h2>

            {!walkInCustomer ? (
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="E-mail klienta"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
                <Button className="w-full" disabled={!email || isLookingUp} onClick={handleLookup}>
                  {isLookingUp ? "Szukam..." : "Szukaj"}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">{walkInCustomer.email}</p>

                {options && !options.seat_available ? (
                  <p className="text-sm text-destructive">
                    Brak wolnych miejsc — wybierz inne zajęcia.
                  </p>
                ) : (
                  options && (
                    <>
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
                        <div className="rounded-lg border px-4 py-3 text-sm text-gray-700">
                          Cena: {options.drop_in_price.toLocaleString("pl-PL")}{" "}
                          {getCurrencySymbol(currency)}
                        </div>
                      )}

                      {fundingType === "use_pass" && (
                        <div className="space-y-2">
                          {options.existing_passes.map((pass: ExistingPassOption) => (
                            <OptionRow
                              key={pass.user_pass_id}
                              label={pass.pass_name}
                              detail={
                                pass.entries_remaining != null
                                  ? `${pass.entries_remaining} wejść`
                                  : "∞"
                              }
                              isSelected={selectedUserPassId === pass.user_pass_id}
                              onClick={() => setSelectedUserPassId(pass.user_pass_id)}
                            />
                          ))}
                        </div>
                      )}

                      {fundingType === "sport_card" && (
                        <div className="space-y-2">
                          {options.sport_card_options.map((card: SportCardOption) => (
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

                      {fundingType === "buy_and_use" && (
                        <div className="space-y-2">
                          {options.buy_and_use_options.map((pass: BuyAndUsePassOption) => (
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

                      {walkInError && <p className="text-sm text-destructive">{walkInError}</p>}

                      <Button
                        className="w-full"
                        variant="cta"
                        size="cta"
                        disabled={!fundingType || isSubmittingWalkIn}
                        onClick={handleWalkInSubmit}
                      >
                        {isSubmittingWalkIn ? "Dodaję..." : "Dodaj uczestnika"}
                      </Button>
                    </>
                  )
                )}
              </>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsWalkInOpen(false);
                setWalkInCustomer(null);
                setOptions(null);
                setEmail("");
                setLookupError(null);
              }}
            >
              Anuluj
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

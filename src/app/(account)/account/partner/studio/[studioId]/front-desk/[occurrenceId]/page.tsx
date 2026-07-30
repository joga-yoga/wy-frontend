"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type {
  BookingOptionsResponse,
  BuyAndUsePassOption,
  ExistingPassOption,
  SportCardOption,
} from "@/app/book/class/[occurrenceId]/types";
import { StatusChip } from "@/components/b2b/StatusChip";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useSetPageSubtitle } from "@/context/PageHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { personSortKey } from "@/lib/personDisplay";
import { cn } from "@/lib/utils";

import { ResolveSheet } from "../components/ResolveSheet";
import { RosterRow } from "../components/RosterRow";
import type { FundingType, RosterEntry, WalkInCandidate, WalkInSearchResponse } from "../types";

interface SessionHeader {
  template_title: string;
  calendar_date: string;
  start_time: string;
  end_time: string;
  instructor_name: string | null;
  room_name: string | null;
}

const FUNDING_LABELS: Record<FundingType, string> = {
  use_pass: "Karnet klienta",
  drop_in: "Wejście jednorazowe",
  sport_card: "Karta sportowa",
  buy_and_use: "Kup karnet",
};

/** "dziś" / "wczoraj" / "12 lipca" — the desk cares which day relative to now. */
function relativeDay(dateStr: string): string {
  const today = new Date();
  const target = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round(
    (target.getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86400000,
  );
  if (diffDays === 0) return "dziś";
  if (diffDays === -1) return "wczoraj";
  if (diffDays === 1) return "jutro";
  return target.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

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
  const { toast } = useToast();

  const [session, setSession] = useState<SessionHeader | null>(null);
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [resolveEntry, setResolveEntry] = useState<RosterEntry | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WalkInSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<WalkInCandidate | null>(null);

  const [options, setOptions] = useState<BookingOptionsResponse | null>(null);
  const [fundingType, setFundingType] = useState<FundingType | undefined>(undefined);
  const [selectedUserPassId, setSelectedUserPassId] = useState<string | null>(null);
  const [selectedSportCardId, setSelectedSportCardId] = useState<string | null>(null);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // T1's header subtitle: "AcroYoga · dziś 18:05 · Oleg · Sala 1". null while loading, so the
  // header shows the title alone rather than flashing partial context.
  useSetPageSubtitle(
    session
      ? [
          session.template_title,
          `${relativeDay(session.calendar_date)} ${formatTime(session.start_time)}`,
          session.instructor_name,
          session.room_name,
        ]
          .filter(Boolean)
          .join(" · ")
      : null,
  );

  const fetchRoster = useCallback(() => {
    axiosInstance
      .get<RosterEntry[]>(`/occurrences/${occurrenceId}/roster`)
      .then((r) => setRoster(r.data))
      .catch(() => setRoster([]));
  }, [occurrenceId]);

  useEffect(() => {
    fetchRoster();
    axiosInstance
      .get<SessionHeader>(`/class-sessions/${occurrenceId}`)
      .then((r) => setSession(r.data))
      .catch(() => setSession(null));
  }, [fetchRoster, occurrenceId]);

  useEffect(() => {
    if (!isAddOpen || query.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const handle = setTimeout(() => {
      axiosInstance
        .get<WalkInSearchResponse>(`/studios/${studioId}/front-desk/search-users`, {
          params: { q: query },
        })
        .then((r) => setSearchResults(r.data))
        .catch(() => setSearchResults(null))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [isAddOpen, query, studioId]);

  async function resolveWith(action: string) {
    if (!resolveEntry) return;
    await axiosInstance.post(`/bookings/${resolveEntry.booking_id}/${action}`);
    fetchRoster();
  }

  async function quickConfirm(entry: RosterEntry) {
    setBusyBookingId(entry.booking_id);
    try {
      await axiosInstance.post(`/bookings/${entry.booking_id}/mark-attended`);
      fetchRoster();
    } finally {
      setBusyBookingId(null);
    }
  }

  async function correctNoShow(entry: RosterEntry) {
    setBusyBookingId(entry.booking_id);
    try {
      await axiosInstance.post(`/bookings/${entry.booking_id}/correct-no-show`);
      fetchRoster();
    } finally {
      setBusyBookingId(null);
    }
  }

  async function selectCandidate(candidate: WalkInCandidate) {
    setSelectedCandidate(candidate);
    try {
      const { data: opts } = await axiosInstance.get<BookingOptionsResponse>(
        `/studios/${studioId}/occurrences/${occurrenceId}/walk-in-options`,
        { params: { user_id: candidate.user_id } },
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
    } catch {
      toast({ description: "Nie udało się wczytać opcji.", variant: "destructive" });
    }
  }

  async function createNewUser() {
    if (!query.includes("@")) return;
    try {
      const { data } = await axiosInstance.post<{
        user_id: string;
        email: string;
        name: string | null;
      }>(`/studios/${studioId}/front-desk/new-user`, { email: query.trim() });
      await selectCandidate({
        user_id: data.user_id,
        email: data.email,
        name: data.name,
        pass_context: null,
      });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ description: detail || "Nie udało się utworzyć konta.", variant: "destructive" });
    }
  }

  function resetAddFlow() {
    setIsAddOpen(false);
    setQuery("");
    setSearchResults(null);
    setSelectedCandidate(null);
    setOptions(null);
    setFundingType(undefined);
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
    if (!selectedCandidate || !fundingType) return;
    setIsSubmittingWalkIn(true);
    try {
      await axiosInstance.post(`/studios/${studioId}/occurrences/${occurrenceId}/walk-in`, {
        user_id: selectedCandidate.user_id,
        funding_type: fundingType,
        user_pass_id: fundingType === "use_pass" ? selectedUserPassId : undefined,
        studio_sport_card_id: fundingType === "sport_card" ? selectedSportCardId : undefined,
        pass_id: fundingType === "buy_and_use" ? selectedPassId : undefined,
      });
      fetchRoster();
      resetAddFlow();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ description: detail || "Nie udało się dodać uczestnika.", variant: "destructive" });
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

  const sorted = roster
    ? [...roster].sort((a, b) =>
        personSortKey(a.user_name, a.user_email).localeCompare(
          personSortKey(b.user_name, b.user_email),
          "pl-PL",
        ),
      )
    : [];
  const zapisanych = roster?.length ?? 0;
  const obecnych = roster?.filter((e) => e.checked_in_at != null).length ?? 0;
  // Exactly the question `RosterRow` asks, answered by the same backend field — so the tile,
  // the chips and the buttons can never disagree. Three call sites reimplementing this is what
  // undercounted money owed last time.
  const doRozliczenia =
    roster?.filter((e) => e.status !== "no_show" && (e.needs_settlement ?? e.is_overdue)).length ??
    0;

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-6">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border bg-white px-3 py-2.5 text-center">
          <p className="text-lg font-semibold text-gray-900">{zapisanych}</p>
          <p className="text-xs text-gray-500">zapisanych</p>
        </div>
        <div className="rounded-xl border bg-white px-3 py-2.5 text-center">
          <p className="text-lg font-semibold text-gray-900">{obecnych}</p>
          <p className="text-xs text-gray-500">obecnych</p>
        </div>
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 text-center",
            doRozliczenia > 0 ? "border-b2b-amber-border bg-b2b-amber-bg" : "bg-white",
          )}
        >
          <p
            className={cn(
              "text-lg font-semibold",
              doRozliczenia > 0 ? "text-b2b-amber-text" : "text-gray-900",
            )}
          >
            {doRozliczenia}
          </p>
          <p className={cn("text-xs", doRozliczenia > 0 ? "text-b2b-amber-text" : "text-gray-500")}>
            do rozliczenia
          </p>
        </div>
      </div>

      {roster === null ? (
        <p className="py-8 text-center text-sm text-gray-400">Ładowanie...</p>
      ) : roster.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Brak rezerwacji na te zajęcia.</p>
      ) : (
        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {sorted.map((entry) => (
            <RosterRow
              key={entry.booking_id}
              entry={entry}
              isBusy={busyBookingId === entry.booking_id}
              onConfirm={() => quickConfirm(entry)}
              onOpenResolve={() => setResolveEntry(entry)}
              onCorrectNoShow={() => correctNoShow(entry)}
            />
          ))}
        </div>
      )}

      {/* Pinned footer (reception-desk §2) — fade gradient, list scrolls under. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pb-4 pt-8">
        <div className="mx-auto flex max-w-lg gap-2 px-4">
          <Button className="flex-1" onClick={() => setIsAddOpen(true)}>
            Dodaj uczestnika
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/konto/partner/studio/${studioId}/front-desk/sell-pass`}>
              Sprzedaj karnet
            </Link>
          </Button>
        </div>
      </div>

      <ResolveSheet
        entry={resolveEntry}
        open={resolveEntry != null}
        onOpenChange={(open) => !open && setResolveEntry(null)}
        onMarkPaid={() => resolveWith("mark-paid")}
        onMarkCardOk={() => resolveWith("mark-card-ok")}
        onMarkAttended={() => resolveWith("mark-attended")}
        onMarkNoShow={() => resolveWith("mark-no-show")}
      />

      <Drawer open={isAddOpen} onOpenChange={(open) => !open && resetAddFlow()} showSwipeHandle>
        <DrawerContent className="sm:mx-auto sm:max-w-md">
          <DrawerHeader className="flex-row items-center justify-between">
            <DrawerTitle>Dodaj uczestnika</DrawerTitle>
            <button onClick={resetAddFlow} aria-label="Zamknij" className="p-1">
              <X size={18} />
            </button>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-6">
            {!selectedCandidate ? (
              <>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Imię, nazwisko lub email"
                    className="pl-9"
                  />
                </div>

                {isSearching && <p className="text-xs text-gray-400">Szukam...</p>}

                {searchResults && searchResults.studio_clients.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Klienci studia
                    </p>
                    <div className="rounded-xl border bg-white overflow-hidden divide-y">
                      {searchResults.studio_clients.map((c) => (
                        <button
                          key={c.user_id}
                          onClick={() => selectCandidate(c)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {c.name || c.email}
                            </p>
                            {c.name && <p className="truncate text-xs text-gray-500">{c.email}</p>}
                          </div>
                          {c.pass_context && (
                            <span className="shrink-0 text-xs text-gray-500">{c.pass_context}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults && searchResults.other_accounts.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Inne konta joga.yoga
                    </p>
                    <div className="rounded-xl border bg-white overflow-hidden divide-y">
                      {searchResults.other_accounts.map((c) => (
                        <button
                          key={c.user_id}
                          onClick={() => selectCandidate(c)}
                          className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <p className="truncate text-sm font-medium text-gray-900">
                            {c.name || c.email}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults &&
                  searchResults.studio_clients.length === 0 &&
                  searchResults.other_accounts.length === 0 &&
                  !isSearching && (
                    <div className="space-y-2">
                      <p className="px-1 text-sm text-gray-400">nie ma na liście</p>
                      <button
                        onClick={createNewUser}
                        disabled={!query.includes("@")}
                        className="flex w-full items-center gap-2 rounded-xl border px-4 py-3.5 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                      >
                        + Nowy użytkownik — podaj email
                      </button>
                    </div>
                  )}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">{selectedCandidate.email}</p>

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

                      <Button
                        className="w-full"
                        variant="green"
                        disabled={!fundingType || isSubmittingWalkIn}
                        onClick={handleWalkInSubmit}
                      >
                        {isSubmittingWalkIn ? "Dodaję..." : "Dodaj uczestnika"}
                      </Button>
                    </>
                  )
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setOptions(null);
                    setFundingType(undefined);
                  }}
                >
                  ← Wybierz inną osobę
                </Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

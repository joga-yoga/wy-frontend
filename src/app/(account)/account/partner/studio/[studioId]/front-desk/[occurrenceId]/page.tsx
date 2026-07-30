"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type {
  BookingOptionsResponse,
  BuyAndUsePassOption,
  SportCardOption,
} from "@/app/book/class/[occurrenceId]/types";
import { StatusChip } from "@/components/b2b/StatusChip";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useSetPageSubtitle } from "@/context/PageHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { personInitials, personLabel, personSortKey } from "@/lib/personDisplay";
import { plural } from "@/lib/polishPlural";
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

/**
 * One payment choice (mockup T4-v2): radio, label, optional neutral chip, subtitle.
 *
 * T4-v2 flattens what used to be two steps — pick a funding *type*, then pick within it — into a
 * single list of concrete choices. The desk is choosing "how is this person paying", and that is
 * one decision, not two.
 */
function PaymentOptionRow({
  label,
  detail,
  chip,
  isSelected,
  onClick,
}: {
  label: string;
  detail?: string | null;
  chip?: string | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors",
        isSelected ? "border-b2b-green-text ring-1 ring-b2b-green-text" : "border-gray-200",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          isSelected ? "border-b2b-green-text" : "border-gray-300",
        )}
      >
        {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-b2b-green-text" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{label}</span>
          {/* Neutral, never possessive: "Aktywny karnet", not "JEJ karnet" — the desk may be
           * looking at anyone's account, and gendered/possessive copy is banned system-wide. */}
          {chip && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {chip}
            </span>
          )}
        </span>
        {detail && <span className="mt-0.5 block text-xs text-gray-500">{detail}</span>}
      </span>
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

  const currency = options?.currency || "PLN";

  /** The flat list of concrete ways this person can pay (T4-v2). Order follows what the desk
   * reaches for most often: an existing pass, then cash at the door, then buying a pass, then a
   * sport card. Each choice carries the funding type *and* the specific id, so selecting one
   * fully determines the request payload — the submit path itself is unchanged. */
  type PaymentChoice = {
    key: string;
    fundingType: FundingType;
    label: string;
    detail?: string | null;
    chip?: string | null;
    userPassId?: string;
    sportCardId?: string;
    passId?: string;
    /** True for the "Kup karnet" row, which expands into the individual passes. */
    isGroup?: boolean;
  };

  const paymentChoices: PaymentChoice[] = [];
  if (options) {
    const sym = getCurrencySymbol(currency);
    for (const pass of options.existing_passes) {
      const left =
        pass.entries_remaining != null
          ? `po rezerwacji ${plural(pass.entries_remaining - 1, "zostanie", "zostaną", "zostanie")} ${pass.entries_remaining - 1}`
          : "bez limitu wejść";
      paymentChoices.push({
        key: `pass:${pass.user_pass_id}`,
        fundingType: "use_pass",
        label: pass.pass_name,
        chip: "Aktywny karnet",
        detail: `Z konta klienta · ${left}`,
        userPassId: pass.user_pass_id,
      });
    }
    if (options.drop_in_price != null) {
      paymentChoices.push({
        key: "drop_in",
        fundingType: "drop_in",
        label: `Pojedyncze wejście · ${options.drop_in_price.toLocaleString("pl-PL")} ${sym}`,
        detail: "Gotówka na miejscu",
      });
    }
    // A studio can offer a dozen passes. T4-v2 collapses them behind one "Kup karnet" row
    // summarising the cheapest per-entry price and the count, so buying a pass does not crowd
    // out the two choices the desk makes most often (existing pass, cash at the door).
    if (options.buy_and_use_options.length > 0) {
      const perEntry = options.buy_and_use_options
        .map((pass) => (pass.session_count ? pass.price / pass.session_count : null))
        .filter((v): v is number => v != null);
      const cheapest = perEntry.length > 0 ? Math.min(...perEntry) : null;
      paymentChoices.push({
        key: "buy",
        fundingType: "buy_and_use",
        label: "Kup karnet",
        detail: [
          cheapest != null
            ? `Od ${cheapest.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} ${sym}/wejście`
            : null,
          `${options.buy_and_use_options.length} ${plural(options.buy_and_use_options.length, "karnet", "karnety", "karnetów")}`,
        ]
          .filter(Boolean)
          .join(" · "),
        isGroup: true,
      });
    }
    // Collapsed for the same reason as the passes (T4-v2): a studio accepting five card brands
    // should not push the everyday choices off the screen.
    if (options.accepts_sport_cards && options.sport_card_options.length > 0) {
      const names = options.sport_card_options.map((c) => c.name).filter(Boolean) as string[];
      paymentChoices.push({
        key: "card",
        fundingType: "sport_card",
        label: "Karta sportowa",
        detail:
          names.length > 2 ? `${names.slice(0, 2).join(", ")} i inne` : names.join(", ") || null,
        isGroup: true,
      });
    }
  }

  const selectedChoiceKey = (() => {
    if (fundingType === "use_pass" && selectedUserPassId) return `pass:${selectedUserPassId}`;
    if (fundingType === "drop_in") return "drop_in";
    if (fundingType === "buy_and_use") return "buy";
    if (fundingType === "sport_card") return "card";
    return null;
  })();

  function applyChoice(choice: PaymentChoice) {
    setFundingType(choice.fundingType);
    setSelectedUserPassId(choice.userPassId ?? null);
    setSelectedSportCardId(choice.isGroup ? null : (choice.sportCardId ?? null));
    // Selecting the group only opens it; the concrete pass is chosen from the nested list, so
    // the CTA stays disabled until the desk has actually picked one.
    setSelectedPassId(choice.isGroup ? null : (choice.passId ?? null));
  }

  /** The CTA names the chosen instrument, as drawn ("Dodaj rezerwację z karnetu"). */
  const submitLabel =
    fundingType === "use_pass"
      ? "Dodaj rezerwację z karnetu"
      : fundingType === "buy_and_use"
        ? "Kup karnet i dodaj rezerwację"
        : fundingType === "sport_card"
          ? "Dodaj rezerwację z karty"
          : "Dodaj rezerwację";

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
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {personInitials(c.name, c.email)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-gray-900">
                              {personLabel(c.name, c.email).primary}
                            </span>
                            {/* Pass context inline, so the desk does not open a second screen. */}
                            <span className="block truncate text-xs text-gray-500">
                              {c.pass_context ?? personLabel(c.name, c.email).secondary ?? ""}
                            </span>
                          </span>
                          <StatusChip tone="green">Klient</StatusChip>
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
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {personInitials(c.name, c.email)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-gray-900">
                              {personLabel(c.name, c.email).primary}
                            </span>
                            {personLabel(c.name, c.email).secondary && (
                              <span className="block truncate text-xs text-gray-500">
                                {personLabel(c.name, c.email).secondary}
                              </span>
                            )}
                          </span>
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
                      <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs text-gray-400">nie ma na liście</span>
                        <span className="h-px flex-1 bg-gray-200" />
                      </div>
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
                <p className="text-sm font-semibold text-gray-900">
                  {personLabel(selectedCandidate.name, selectedCandidate.email).primary}
                </p>

                {options && !options.seat_available ? (
                  <p className="text-sm text-destructive">
                    Brak wolnych miejsc — wybierz inne zajęcia.
                  </p>
                ) : (
                  options && (
                    <>
                      {paymentChoices.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          Brak dostępnych opcji płatności dla tych zajęć.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {paymentChoices.map((choice) => (
                            <div key={choice.key} className="space-y-2">
                              <PaymentOptionRow
                                label={choice.label}
                                detail={choice.detail}
                                chip={choice.chip}
                                isSelected={selectedChoiceKey === choice.key}
                                onClick={() => applyChoice(choice)}
                              />
                              {choice.isGroup &&
                                choice.fundingType === "buy_and_use" &&
                                fundingType === "buy_and_use" && (
                                  <div className="ml-8 space-y-2">
                                    {options.buy_and_use_options.map(
                                      (pass: BuyAndUsePassOption) => (
                                        <PaymentOptionRow
                                          key={pass.pass_id}
                                          label={pass.name}
                                          detail={`${pass.price.toLocaleString("pl-PL")} ${getCurrencySymbol(pass.currency || currency)}`}
                                          isSelected={selectedPassId === pass.pass_id}
                                          onClick={() => setSelectedPassId(pass.pass_id)}
                                        />
                                      ),
                                    )}
                                  </div>
                                )}
                              {choice.isGroup &&
                                choice.fundingType === "sport_card" &&
                                fundingType === "sport_card" && (
                                  <div className="ml-8 space-y-2">
                                    {options.sport_card_options.map((card: SportCardOption) => (
                                      <PaymentOptionRow
                                        key={card.studio_sport_card_id}
                                        label={card.name || "Karta sportowa"}
                                        detail={
                                          card.fee
                                            ? `Dopłata ${card.fee.toLocaleString("pl-PL")} ${getCurrencySymbol(currency)}`
                                            : "Bez dopłaty"
                                        }
                                        isSelected={
                                          selectedSportCardId === card.studio_sport_card_id
                                        }
                                        onClick={() =>
                                          setSelectedSportCardId(card.studio_sport_card_id)
                                        }
                                      />
                                    ))}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        className="w-full"
                        variant="green"
                        disabled={
                          !fundingType ||
                          (fundingType === "buy_and_use" && !selectedPassId) ||
                          (fundingType === "sport_card" && !selectedSportCardId) ||
                          isSubmittingWalkIn
                        }
                        onClick={handleWalkInSubmit}
                      >
                        {isSubmittingWalkIn ? "Dodaję..." : submitLabel}
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

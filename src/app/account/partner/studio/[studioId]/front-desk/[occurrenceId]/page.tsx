"use client";

import { ArrowLeft, ChevronDown, Plus, Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  BookingOptionsResponse,
  BuyAndUsePassOption,
  SportCardOption,
} from "@/app/book/class/[occurrenceId]/types";
import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { Button } from "@/components/ui/button";
import { DrawerFooter } from "@/components/ui/drawer";
import {
  FormDrawer,
  FormDrawerBody,
  FormDrawerContent,
  FormDrawerHeader,
} from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import {
  useSetPageHeaderAction,
  useSetPageSubtitle,
  useSetPageTitle,
} from "@/context/PageHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { personInitials, personLabel, personSortKey } from "@/lib/personDisplay";
import { osoby, plural } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";

import type { SessionDetailResponse } from "../../../../schedule/types";
import { ResolveSheet } from "../components/ResolveSheet";
import { RosterRow, RosterRowUndoStrip } from "../components/RosterRow";
import { SessionOverflowMenu } from "../components/SessionOverflowMenu";
import { isPendingEntry } from "../rosterGrouping";
import type { FundingType, RosterEntry, WalkInCandidate, WalkInSearchResponse } from "../types";

// Field doubles as a search query up to this point (any text is fine — no validation
// needed) and only becomes an email the instant "+ Nowy użytkownik" is clicked. A bare
// `.includes("@")` check let malformed addresses (e.g. "a@b") through to the create
// call, which crashed the toast on the backend's structured validation-error response
// (see `createNewUser`'s catch block) instead of showing a helpful message here first.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** FastAPI's `detail` is usually a string, but a Pydantic validation failure (422) sends
 * a *list* of `{loc,msg,type}` objects instead — `toast({ description })` renders that
 * value directly as a React child, and an array-of-objects there crashes with "Objects
 * are not valid as a React child". Always resolve to a display string first. */
function extractErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown };
    if (typeof first?.msg === "string") return first.msg;
  }
  return fallback;
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
        "flex w-full items-start gap-3 rounded-b2b border bg-white px-4 py-3 text-left transition-colors",
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

  const [session, setSession] = useState<SessionDetailResponse | null>(null);
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [resolveEntry, setResolveEntry] = useState<RosterEntry | null>(null);
  // Rozstrzygnięte starts collapsed while Oczekuje is non-empty, and expands automatically
  // once it empties (spec §4.2) — one-directional: it never re-collapses on its own once open.
  const [isResolvedExpanded, setIsResolvedExpanded] = useState(false);
  const [undoState, setUndoState] = useState<{
    bookingId: string;
    label: string;
    amount: number | null;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WalkInSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<WalkInCandidate | null>(null);
  // Third state of the add-participant drawer, alongside "search" and "candidate picked":
  // creating a person who isn't in the system yet. Its own field rather than the search
  // box, so "look someone up" and "create someone" stay two separate intents.
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  const [options, setOptions] = useState<BookingOptionsResponse | null>(null);
  const [fundingType, setFundingType] = useState<FundingType | undefined>(undefined);
  const [selectedUserPassId, setSelectedUserPassId] = useState<string | null>(null);
  const [selectedSportCardId, setSelectedSportCardId] = useState<string | null>(null);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // Facts header (spec §3/§8): class name as the page title, the rest — "dziś 18:05 · Oleg ·
  // Sala 1" — as the subtitle beneath it. null while loading, so the header shows nothing
  // rather than flashing partial context. An instructor additionally gets the studio name
  // (§8: "an instructor may teach at several") — an owner doesn't need it, they navigated
  // from within a studio context already.
  useSetPageTitle(session?.template_title ?? null);
  useSetPageSubtitle(
    session
      ? [
          `${relativeDay(session.calendar_date)} ${formatTime(session.start_time)}`,
          session.instructor_name,
          session.room_name,
          session.role === "instructor" ? session.studio_name : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null,
  );
  // Overflow menu (spec §7) — owner-only, and not on a cancelled session (view-only there).
  useSetPageHeaderAction(
    session && session.role === "owner" && session.status !== "cancelled" ? (
      <SessionOverflowMenu
        occurrenceId={occurrenceId}
        recurrenceFrequency={session.recurrence_frequency}
        recurrenceDays={session.recurrence_days}
      />
    ) : null,
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
      .get<SessionDetailResponse>(`/class-sessions/${occurrenceId}`)
      .then((r) => setSession(r.data))
      .catch(() => setSession(null));
  }, [fetchRoster, occurrenceId]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Auto-expand Rozstrzygnięte once Oczekuje empties (spec §4.2) — never re-collapses on its
  // own once open, so the desk's own manual toggle (if any) is never fought.
  const oczekujeCount = roster?.filter(isPendingEntry).length ?? 0;
  useEffect(() => {
    if (roster !== null && oczekujeCount === 0) setIsResolvedExpanded(true);
  }, [roster, oczekujeCount]);

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

  // Undo (spec §6) persists until the next resolving action or 10s, whichever comes first —
  // so every other resolving action below clears it before doing its own thing.
  function clearUndo() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setUndoState(null);
  }

  async function resolveWith(action: string) {
    if (!resolveEntry) return;
    clearUndo();
    await axiosInstance.post(`/bookings/${resolveEntry.booking_id}/${action}`);
    fetchRoster();
  }

  async function quickConfirm(entry: RosterEntry) {
    setBusyBookingId(entry.booking_id);
    clearUndo();
    try {
      await axiosInstance.post(`/bookings/${entry.booking_id}/confirm`);
      fetchRoster();
      setUndoState({
        bookingId: entry.booking_id,
        label: personLabel(entry.user_name, entry.user_email).primary,
        amount: entry.amount_owed ?? null,
      });
      undoTimerRef.current = setTimeout(() => setUndoState(null), 10_000);
    } catch (err: unknown) {
      // No optimistic mutation happened above, so there's nothing to roll back — just surface
      // the error. The desk must never believe money was collected when it wasn't.
      toast({
        description: extractErrorMessage(err, "Nie udało się potwierdzić."),
        variant: "destructive",
      });
    } finally {
      setBusyBookingId(null);
    }
  }

  async function undoConfirm() {
    if (!undoState) return;
    const { bookingId } = undoState;
    setBusyBookingId(bookingId);
    try {
      await axiosInstance.post(`/bookings/${bookingId}/undo-confirm`);
      fetchRoster();
    } finally {
      setBusyBookingId(null);
      clearUndo();
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

  /** Enter the create step, carrying over an email the desk has already typed into search. */
  function openCreateUser() {
    setNewUserEmail(isValidEmail(query) ? query.trim() : "");
    setIsCreatingUser(true);
  }

  function cancelCreateUser() {
    setIsCreatingUser(false);
    setNewUserEmail("");
  }

  async function createNewUser() {
    if (!isValidEmail(newUserEmail) || isSubmittingNewUser) return;
    setIsSubmittingNewUser(true);
    try {
      const { data } = await axiosInstance.post<{
        user_id: string;
        email: string;
        name: string | null;
      }>(`/studios/${studioId}/front-desk/new-user`, { email: newUserEmail.trim() });
      setIsCreatingUser(false);
      setNewUserEmail("");
      await selectCandidate({
        user_id: data.user_id,
        email: data.email,
        name: data.name,
        pass_context: null,
      });
    } catch (err: unknown) {
      toast({
        description: extractErrorMessage(err, "Nie udało się utworzyć konta."),
        variant: "destructive",
      });
    } finally {
      setIsSubmittingNewUser(false);
    }
  }

  function resetAddFlow() {
    setIsAddOpen(false);
    setQuery("");
    setSearchResults(null);
    setSelectedCandidate(null);
    setIsCreatingUser(false);
    setNewUserEmail("");
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
      toast({
        description: extractErrorMessage(err, "Nie udało się dodać uczestnika."),
        variant: "destructive",
      });
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

  const byPolishName = (a: RosterEntry, b: RosterEntry) =>
    personSortKey(a.user_name, a.user_email).localeCompare(
      personSortKey(b.user_name, b.user_email),
      "pl-PL",
    );
  // Two groups (spec §4.1): `Oczekuje` — attendance unresolved or money/card still owed;
  // `Rozstrzygnięte` — everything settled, confirmed attendance and recorded absences alike.
  // Single-sourced with the row via `isPendingEntry` — three call sites re-deriving this is
  // exactly what undercounted money owed once before.
  const oczekujeGroup = roster ? [...roster].filter(isPendingEntry).sort(byPolishName) : [];
  const rozstrzygnieteGroup = roster
    ? [...roster].filter((e) => !isPendingEntry(e)).sort(byPolishName)
    : [];
  const zapisanych = roster?.length ?? 0;
  const obecnych = roster?.filter((e) => e.checked_in_at != null).length ?? 0;
  // Exactly the question `RosterRow` asks, answered by the same backend field — so the tile,
  // the chips and the buttons can never disagree. Three call sites reimplementing this is what
  // undercounted money owed last time.
  const doRozliczenia =
    roster?.filter((e) => e.status !== "no_show" && (e.needs_settlement ?? e.is_overdue)).length ??
    0;

  function renderRow(entry: RosterEntry) {
    if (undoState && undoState.bookingId === entry.booking_id) {
      return (
        <RosterRowUndoStrip
          key={entry.booking_id}
          label={undoState.label}
          amount={undoState.amount}
          isBusy={busyBookingId === entry.booking_id}
          onUndo={undoConfirm}
        />
      );
    }
    return (
      <RosterRow
        key={entry.booking_id}
        entry={entry}
        isBusy={busyBookingId === entry.booking_id}
        onConfirm={() => quickConfirm(entry)}
        onOpenResolve={() => setResolveEntry(entry)}
      />
    );
  }

  // Cancelled sessions render read-only (spec §3): facts header (via the top bar) plus this
  // banner, no counters, no roster actions, no overflow beyond viewing. Applies regardless of
  // role — the same message is correct whether the caller owns the studio or just teaches here.
  if (session?.status === "cancelled") {
    return (
      <div className="mx-auto max-w-lg px-4 pb-8 pt-3">
        <div className="rounded-b2b border border-b2b-red-border bg-b2b-red-bg px-4 py-3">
          <p className="text-sm font-semibold text-b2b-red-text">Sesja odwołana</p>
          {session.notified_count > 0 && (
            <p className="mt-0.5 text-xs text-b2b-red-text/80">
              Powiadomiliśmy {osoby(session.notified_count)}.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Read-only instructor variant (spec §8) — same skeleton, reduced: two counters, a flat
  // alphabetical list with a neutral present/not-yet indicator, no funding anywhere (the
  // backend's `InstructorRosterEntry` structurally can't carry it — nothing here to hide).
  // Role-driven, not Grafik-variant-driven: a solo instructor-owner never reaches this branch,
  // since T01's resolver resolves them to "owner" first.
  if (session?.role === "instructor") {
    const sortedForInstructor = roster ? [...roster].sort(byPolishName) : [];
    const zapisanychInstr = roster?.length ?? 0;
    const obecnychInstr = roster?.filter((e) => e.checked_in_at != null).length ?? 0;

    return (
      <div className="mx-auto max-w-lg px-4 pb-8 pt-3">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-b2b border bg-white px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-gray-900">{zapisanychInstr}</p>
            <p className="text-xs font-semibold text-gray-400">zapisanych</p>
          </div>
          <div className="rounded-b2b border bg-white px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-gray-900">{obecnychInstr}</p>
            <p className="text-xs font-semibold text-gray-400">obecnych</p>
          </div>
        </div>

        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Uczestnicy
        </p>
        {roster === null ? (
          <p className="py-8 text-center text-sm text-gray-400">Ładowanie...</p>
        ) : roster.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Brak rezerwacji na te zajęcia.</p>
        ) : (
          <div className="divide-y rounded-b2b border bg-white overflow-hidden">
            {sortedForInstructor.map((entry) => (
              <div
                key={entry.booking_id}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <p className="min-w-0 truncate text-sm font-semibold text-gray-900">
                  {personLabel(entry.user_name, entry.user_email).primary}
                </p>
                <StatusChip tone={entry.checked_in_at != null ? "green" : "gray"}>
                  {entry.checked_in_at != null ? "Obecność ✓" : "Jeszcze nie"}
                </StatusChip>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 px-1 text-xs text-gray-400">
          To grafik studia. Obecność i płatności rozlicza właściciel.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-3">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-b2b border bg-white px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-gray-900">{zapisanych}</p>
          <p className="text-xs font-semibold text-gray-400">zapisanych</p>
        </div>
        <div className="rounded-b2b border bg-white px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-gray-900">{obecnych}</p>
          <p className="text-xs font-semibold text-gray-400">obecnych</p>
        </div>
        <div
          className={cn(
            "rounded-b2b border px-3 py-2.5 text-center",
            doRozliczenia > 0 ? "border-b2b-amber-border bg-b2b-amber-bg" : "bg-white",
          )}
        >
          <p
            className={cn(
              "text-xl font-bold",
              doRozliczenia > 0 ? "text-b2b-amber-text" : "text-gray-900",
            )}
          >
            {doRozliczenia}
          </p>
          <p
            className={cn(
              "text-xs font-semibold",
              doRozliczenia > 0 ? "text-b2b-amber-text" : "text-gray-400",
            )}
          >
            do rozliczenia
          </p>
        </div>
      </div>

      {roster === null ? (
        <p className="py-8 text-center text-sm text-gray-400">Ładowanie...</p>
      ) : roster.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Brak rezerwacji na te zajęcia.</p>
      ) : (
        <div className="space-y-4">
          {/* Oczekuje (spec §4.1) — never collapsed; check-in should only ever scan names
           * that haven't arrived. */}
          {oczekujeGroup.length > 0 && (
            <div>
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Oczekuje
              </p>
              <div className="divide-y rounded-b2b border bg-white overflow-hidden">
                {oczekujeGroup.map(renderRow)}
              </div>
            </div>
          )}

          {rozstrzygnieteGroup.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setIsResolvedExpanded((v) => !v)}
                className="mb-1.5 flex items-center gap-1 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400"
              >
                Rozstrzygnięte ({rozstrzygnieteGroup.length})
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", isResolvedExpanded && "rotate-180")}
                />
              </button>
              {isResolvedExpanded && (
                <div className="divide-y rounded-b2b border bg-white overflow-hidden">
                  {rozstrzygnieteGroup.map(renderRow)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pinned footer (reception-desk §2) — fade gradient, list scrolls under. Only
       * "Dodaj uczestnika" — selling a pass without booking anyone into this session is
       * still reachable from the Klienci screen's "Sprzedaj karnet" entry point, but it's
       * redundant here: the add-participant flow already offers "Kup karnet i dodaj
       * rezerwację" as one of its payment choices. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pb-4 pt-8">
        <div className="mx-auto max-w-lg px-4">
          <Button size="action" className="w-full" onClick={() => setIsAddOpen(true)}>
            Dodaj uczestnika
          </Button>
        </div>
      </div>

      <ResolveSheet
        entry={resolveEntry}
        open={resolveEntry != null}
        onOpenChange={(open) => !open && setResolveEntry(null)}
        onConfirm={() => (resolveEntry ? quickConfirm(resolveEntry) : Promise.resolve())}
        onMarkNoShow={() => resolveWith("mark-no-show")}
        onCorrectNoShow={() => resolveWith("correct-no-show")}
        onDeskCancel={() => resolveWith("desk-cancel")}
      />

      {/* FormDrawer supersedes the bespoke `[--drawer-height:calc(100dvh-2rem)]` that used
       * to live here, and preserves the property that hack was protecting: the height is
       * pinned up front (via `snapPoints={[1]}`), so the results list can no longer animate
       * the sheet's height on every async result-set change — the original grow/scroll-glitch
       * bug. It additionally stops a body drag from dismissing, which the old version still
       * allowed over the input and the results. */}
      <FormDrawer open={isAddOpen} onClose={resetAddFlow}>
        <FormDrawerContent className="sm:mx-auto sm:max-w-md">
          <FormDrawerHeader title="Dodaj uczestnika" />
          <FormDrawerBody className="space-y-4 pb-6">
            {!selectedCandidate && isCreatingUser ? (
              /* Create step. A person who isn't in the system yet gets their own field and
                 their own confirm — reusing the search box for this conflated "find" with
                 "create" and left the action gated behind typing a valid address into a box
                 labelled "Imię, nazwisko lub email". */
              <>
                <button
                  type="button"
                  onClick={cancelCreateUser}
                  className="-ml-1 flex items-center gap-1 p-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <ArrowLeft size={16} />
                  Wróć do wyszukiwania
                </button>

                <div>
                  <label htmlFor="new-user-email" className="mb-1 block text-sm font-semibold">
                    Email
                  </label>
                  <Input
                    id="new-user-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="jan@example.com"
                  />
                  {newUserEmail.trim().length > 0 && !isValidEmail(newUserEmail) && (
                    <p className="mt-1 px-1 text-xs text-gray-400">
                      Podaj pełny adres e-mail, np. jan@example.com.
                    </p>
                  )}
                </div>

                <Button
                  size="action"
                  className="w-full"
                  disabled={!isValidEmail(newUserEmail) || isSubmittingNewUser}
                  onClick={createNewUser}
                >
                  {isSubmittingNewUser ? "Tworzę..." : "Utwórz i dodaj"}
                </Button>
              </>
            ) : !selectedCandidate ? (
              <>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
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
                    <div className="rounded-b2b border bg-white overflow-hidden divide-y">
                      {searchResults.studio_clients.map((c) => (
                        <button
                          key={c.user_id}
                          onClick={() => selectCandidate(c)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <HashedAvatar
                            seed={c.user_id}
                            name={personLabel(c.name, c.email).primary}
                            initialsOverride={personInitials(c.name, c.email)}
                            size={36}
                          />
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

                {/* "Not on the list" is only worth saying once a search has actually come
                    back empty; the CTA below stands on its own before that. */}
                {searchResults && searchResults.studio_clients.length === 0 && !isSearching && (
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400">nie ma na liście</span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                )}

                {/* Shown in exactly two situations: the default state (nothing searched
                    yet) and a search that came back empty. Once there are matches on
                    screen the manager is scanning them, and a competing primary action
                    there is just noise. */}
                {(searchResults?.studio_clients.length ?? 0) === 0 && (
                  <Button size="action" className="w-full" onClick={openCreateUser}>
                    <Plus size={18} className="mr-1.5" />
                    Utwórz użytkownika
                  </Button>
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
                    </>
                  )
                )}
              </>
            )}
          </FormDrawerBody>

          {/* Pinned so both actions stay reachable while the results/payment-choice list
           * scrolls above — "Wybierz inną osobę" collapsed to a circular icon button next
           * to "Dodaj rezerwację" per the reception-desk polish brief. */}
          {selectedCandidate && (
            <DrawerFooter className="flex-row items-center gap-2">
              <Button
                type="button"
                size="action"
                variant="outline"
                aria-label="Wybierz inną osobę"
                className="h-12 w-12 shrink-0 rounded-full p-0"
                onClick={() => {
                  setSelectedCandidate(null);
                  setOptions(null);
                  setFundingType(undefined);
                }}
              >
                <ArrowLeft size={18} />
              </Button>
              {options && options.seat_available && paymentChoices.length > 0 && (
                <Button
                  size="action"
                  className="flex-1"
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
              )}
            </DrawerFooter>
          )}
        </FormDrawerContent>
      </FormDrawer>
    </div>
  );
}

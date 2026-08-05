"use client";

import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { axiosInstance } from "@/lib/axiosInstance";
import { sesje } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";

import type { DayStripHandle } from "./components/DayStrip";
import { DayStrip } from "./components/DayStrip";
import { GrafikContextChips } from "./components/GrafikContextChips";
import { GrafikSessionCard } from "./components/GrafikSessionCard";
import type { ScheduleDaySummary, ScheduleOccurrence, ScheduleWeekResponse } from "./types";

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "Poniedziałek, 13 lipca" — full month, capitalized weekday, as drawn in A1. */
function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { capabilities, isLoading: isLoadingCapabilities } = usePartnerCapabilities();
  const { studio: currentStudio } = useCurrentStudio();

  // Grafik is absent entirely for events-only/fresh partners and, for teaching-only
  // partners, is the read-only variant — never this managed-owner view (spec-b2b §3).
  useEffect(() => {
    if (isLoadingCapabilities || !capabilities) return;
    if (capabilities.managedStudios.length > 0) return;
    router.replace(
      capabilities.teachingStudios.length > 0
        ? "/konto/partner/grafik/instructor"
        : "/konto/partner/rezerwacje",
    );
  }, [isLoadingCapabilities, capabilities, router]);

  const studioParam = searchParams.get("studio_id") ?? "";
  const [studioId, setStudioId] = useState(studioParam);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [days, setDays] = useState<ScheduleDaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reconciliation, setReconciliation] = useState<{
    sessionCount: number;
    showStudioLabels: boolean;
    studioName: string | null;
  }>({ sessionCount: 0, showStudioLabels: false, studioName: null });

  useEffect(() => {
    axiosInstance
      .get<{ id: string; name: string }[]>("/studios")
      .then((r) => {
        if (!studioId && r.data?.length) setStudioId(r.data[0].id);
      })
      .catch(() => {});
  }, [studioId]);

  // The reconciliation strip is global across every studio the partner manages and
  // independent of the selected Grafik chip (reception-desk §5) — it must not read
  // as "nothing to do" just because a different studio is the current context.
  useEffect(() => {
    axiosInstance
      .get<{
        sessions: { studio_id?: string; studio_name?: string }[];
        total: number;
        show_studio_labels: boolean;
      }>("/partner/reconciliation")
      .then(({ data }) => {
        const distinctStudioNames = [
          ...new Set(data.sessions.map((s) => s.studio_name).filter(Boolean)),
        ];
        setReconciliation({
          // The strip counts *sessions* ("2 sesje do rozliczenia", A1), and the list it links to
          // is grouped by session. The endpoint's `total` is the number of unresolved *bookings*
          // (sum of per-session counts), so using it here read as "7 sesji" when 7 people owed
          // money across 6 sessions.
          sessionCount: data.sessions.length,
          showStudioLabels: data.show_studio_labels,
          // Only unambiguous when every flagged session belongs to the same studio —
          // a mixed set gets its per-session labels in the reconciliation list instead.
          studioName: distinctStudioNames.length === 1 ? (distinctStudioNames[0] as string) : null,
        });
      })
      .catch(() =>
        setReconciliation({ sessionCount: 0, showStudioLabels: false, studioName: null }),
      );
  }, []);

  const fetchWeek = useCallback(() => {
    if (!studioId) return;
    setIsLoading(true);
    axiosInstance
      .get<ScheduleWeekResponse>("/class-grafik/week", {
        params: { studio_id: studioId, week_start: formatDate(weekStart) },
      })
      .then((r) => setDays(r.data.days))
      .catch(() =>
        toast({ description: "Nie udało się załadować grafiku.", variant: "destructive" }),
      )
      .finally(() => setIsLoading(false));
  }, [studioId, weekStart, toast]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  const sessionCounts = useMemo(() => days.map((d) => d.session_count), [days]);
  const selectedDay = days[selectedDayIndex];
  const hasAnySessions = days.some((d) => d.session_count > 0);

  // Derived from the strip's own state rather than from `days[selectedDayIndex].date`, so the
  // header title stays correct (and stable) while a week is still loading or came back empty.
  const selectedDate = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + selectedDayIndex);
    return formatDate(d);
  }, [weekStart, selectedDayIndex]);

  const dayStripRef = useRef<DayStripHandle>(null);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  // The live window (spec §2.1) must re-evaluate while the screen stays open, not just on
  // load — a card should go live and stop being live without a reload.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), {
      // The sentinel disappears under the header, not off the top of the viewport.
      rootMargin: "-64px 0px 0px 0px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function shiftWeek(deltaDays: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + deltaDays);
    setWeekStart(d);
  }

  /** Moves one day, rolling into the neighbouring week at the edges so neither the swipe
   * nor the chevrons ever dead-end on Monday or Sunday. Shared by both so the two controls
   * cannot drift apart. */
  const shiftDay = useCallback((direction: 1 | -1) => {
    setSelectedDayIndex((current) => {
      const next = current + direction;
      if (next < 0) {
        dayStripRef.current?.goToPreviousWeek();
        return 6;
      }
      if (next > 6) {
        dayStripRef.current?.goToNextWeek();
        return 0;
      }
      return next;
    });
  }, []);

  const daySwipe = useHorizontalSwipe(shiftDay);

  // Tapping a card navigates straight to the session screen (spec §1) — no intermediate
  // drawer. Legacy null-studio_id occurrences fall back to the studio this Grafik is already
  // showing (research finding F), or the link would break for ~35 of 45 dev schedules.
  function goToSession(occ: ScheduleOccurrence) {
    const targetStudioId = occ.studio_id ?? currentStudio?.id ?? studioId;
    if (!targetStudioId) return;
    router.push(`/konto/partner/studio/${targetStudioId}/front-desk/${occ.id}`);
  }

  return (
    // Sized to exactly fill the viewport rather than `min-h-screen`: the sticky header
    // (--dashboard-header-h) and the layout's pb-28 tab-bar gutter both sit *outside* this
    // element, so a full 100dvh here made every day scroll by ~176px even when it held one
    // session. Flex column so the day content below can claim the leftover height.
    <div className="mx-auto flex min-h-[calc(100dvh-var(--dashboard-header-h)-7rem)] max-w-lg flex-col px-4 pt-0 md:min-h-[calc(100dvh-var(--dashboard-header-h))]">
      <GrafikContextChips />

      {/* Sentinel: while it is still on screen the block above hasn't pinned yet. Must sit
       * *before* the sticky element — once stuck, the sticky element itself never leaves the
       * viewport, so it can't observe its own state. */}
      <div ref={stickySentinelRef} className="h-0" />

      {/* Week nav + day strip pin together below the header. Offsetting from
       * --dashboard-header-h rather than a literal top-16 keeps this correct at md:,
       * where the header grows to 5rem. */}
      <div
        className="sticky z-30 -mx-4 bg-background px-4 pb-3"
        style={{ top: "var(--dashboard-header-h)" }}
      >
        <DayStrip
          ref={dayStripRef}
          weekStart={weekStart}
          sessionCounts={sessionCounts}
          selectedIndex={selectedDayIndex}
          isLoading={isLoading}
          onSelectDay={setSelectedDayIndex}
          onShiftWeek={shiftWeek}
        />

        {/* Title row sits *below* the strip and names the selected day, not the week range —
         * the strip itself already shows which week you are in, so repeating it above was
         * the less useful of the two labels. Type matches the public studio schedule's day
         * header. The chevrons move by one day to agree with the title they sit beside;
         * whole weeks are still reachable by swiping the strip (and by rolling past Sunday). */}
        <div className="flex items-center justify-between gap-3 pt-3">
          <span className="truncate text-lg font-bold capitalize text-gray-900">
            {formatDayHeader(selectedDate)}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => shiftDay(-1)}
              aria-label="Poprzedni dzień"
              className="rounded p-1 hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => shiftDay(1)}
              aria-label="Następny dzień"
              className="rounded p-1 hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        {/* Hairline only once stuck, so the unscrolled page looks unchanged. */}
        {isStuck && <div className="-mx-4 mt-2 h-px bg-gray-200" />}
      </div>

      {/* Day content — swipeable left/right to change day. `flex-1` so it claims all the
       * leftover height: the gesture used to be dead above the whitespace under a short day,
       * because the handlers only covered the cards themselves. It carries the page's bottom
       * padding too (rather than the container) so that gutter is swipeable as well. */}
      <div
        className={cn("mt-0 flex-1", reconciliation.sessionCount > 0 ? "pb-24" : "pb-4")}
        {...daySwipe}
      >
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Ładowanie...</p>
        ) : !hasAnySessions ? (
          <div className="rounded-b2b border border-dashed bg-gray-50 py-8 px-4 text-center space-y-3">
            <Calendar size={24} className="mx-auto text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Grafik jest pusty</p>
            <p className="text-xs text-gray-500">
              Dodaj pierwsze zajęcia, żeby zbudować cotygodniowy grafik.
            </p>
            <Link href="/konto/partner/grafiki-zajec/create">
              <Button variant="outline" size="sm">
                <Plus size={14} className="mr-1" />
                Dodaj zajęcia
              </Button>
            </Link>
          </div>
        ) : selectedDay && selectedDay.session_count === 0 ? (
          <div className="rounded-b2b border border-dashed bg-gray-50 py-8 px-4 text-center space-y-3">
            <Calendar size={20} className="mx-auto text-gray-400" />
            {selectedDay.date < formatDate(new Date()) ? (
              <p className="text-sm text-gray-500">Nie było zajęć w ten dzień</p>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Brak zajęć w {formatDayHeader(selectedDay.date).split(",")[0]}
                </p>
                <Link href="/konto/partner/grafiki-zajec/create">
                  <Button variant="outline" size="sm">
                    <Plus size={14} className="mr-1" />
                    Dodaj zajęcia
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : selectedDay ? (
          // Separated cards, as on the public studio schedule — the day is already named by
          // the header row above, so no title repeats here.
          <div className="space-y-2">
            {selectedDay.occurrences.map((occ) => (
              <GrafikSessionCard key={occ.id} occ={occ} onClick={goToSession} now={now} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Reconciliation entry (spec §2.2) — pinned right above the bottom tab bar rather than
       * flowing with the day list: a class starting in eight minutes outranks an idle-moment
       * task for top-of-screen position, but a strip that only happens to land near the bottom
       * on a short day (and collides with the fixed add button) reads as broken, not deprioritized. */}
      {reconciliation.sessionCount > 0 && (
        <Link
          href="/konto/partner/rozliczenia"
          className="fixed inset-x-4 bottom-[calc(var(--bottom-tab-h)+0.5rem)] z-30 mx-auto flex h-14 max-w-lg items-center justify-between rounded-xl border border-b2b-amber-border bg-b2b-amber-bg px-4 text-sm font-medium text-b2b-amber-text shadow-md transition-opacity hover:opacity-90 md:bottom-6"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {sesje(reconciliation.sessionCount)} do rozliczenia
            {reconciliation.showStudioLabels && reconciliation.studioName && (
              <> · {reconciliation.studioName}</>
            )}
          </span>
          <ChevronRight size={16} />
        </Link>
      )}

      {/* Fixed add button. Always rendered — it used to be hidden whenever the week had no
       * sessions, which is exactly when adding one matters most. Offsets from
       * --bottom-tab-h (a Tailwind class, not an inline style, so the md: override still
       * wins) because at md: the tab bar becomes a sidebar and the offset is unnecessary.
       * Bumped higher still when the reconciliation strip is showing, so the two never cross. */}
      <Link
        href="/konto/partner/grafiki-zajec/create"
        aria-label="Dodaj zajęcia"
        className={cn(
          "fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-colors hover:bg-gray-800",
          reconciliation.sessionCount > 0
            ? "bottom-[calc(var(--bottom-tab-h)+5rem)] md:bottom-24"
            : "bottom-[calc(var(--bottom-tab-h)+1rem)] md:bottom-6",
        )}
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}

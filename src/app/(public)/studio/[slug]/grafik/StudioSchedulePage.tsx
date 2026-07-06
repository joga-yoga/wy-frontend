"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { StudioPublic } from "@/types/studio";

import type { DayStripHandle } from "./components/DayStrip";
import { DayStrip } from "./components/DayStrip";
import { SessionCard } from "./components/SessionCard";
import { SessionDetailModal } from "./SessionDetailModal";
import type {
  PublicOccurrence,
  PublicScheduleDaySummary,
  PublicScheduleWeekResponse,
} from "./types";

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

function todayDayIndex(): number {
  const dow = new Date().getDay();
  return dow === 0 ? 6 : dow - 1;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const includeYear = d.getFullYear() !== new Date().getFullYear();
  const label = d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" } : {}),
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getCityLabel(studio: StudioPublic): string | null {
  if (studio.location?.city) return studio.location.city;
  if (studio.address) {
    const parts = studio.address
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return null;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function findEarliestDayIndexForClass(
  days: PublicScheduleDaySummary[],
  classSlug: string,
): number | null {
  for (let i = 0; i < days.length; i++) {
    if (days[i].occurrences.some((o) => o.class_slug === classSlug)) return i;
  }
  return null;
}

function ScheduleHeaderIdentity({ studio }: { studio: StudioPublic }) {
  const city = getCityLabel(studio);

  return (
    <Link href={`/studio/${studio.slug}`} className="flex items-center gap-3 px-4 pt-4">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {studio.image_id ? (
          <WyImage src={studio.image_id} alt={studio.name} fill className="object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-bold text-gray-500">
            {initials(studio.name)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold leading-tight text-gray-900">{studio.name}</p>
        {city && <p className="mt-0.5 truncate text-xs text-gray-500">{city}</p>}
      </div>
    </Link>
  );
}

export function StudioSchedulePage({ studio }: { studio: StudioPublic }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [days, setDays] = useState<PublicScheduleDaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOcc, setSelectedOcc] = useState<PublicOccurrence | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(() => todayDayIndex());
  const [headerHeight, setHeaderHeight] = useState(0);

  const dayStripRef = useRef<DayStripHandle>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pendingScrollIndex = useRef<number | null>(null);
  const suppressScrollSync = useRef(false);
  const hasHandledDeepLink = useRef(false);
  const isFirstPathnameEffect = useRef(true);

  // Next.js's client router cache can keep this page's component instance (and its React
  // state) alive across an away-and-back client-side navigation — e.g. browsing to a future
  // week, navigating to the studio profile, then back here — rather than remounting fresh.
  // Without this, that round trip would resume the future week instead of landing back on
  // today. usePathname() still re-fires this effect on re-entry even when the instance was
  // never actually unmounted, because its returned value genuinely changed away and back.
  useEffect(() => {
    if (isFirstPathnameEffect.current) {
      isFirstPathnameEffect.current = false;
      return;
    }
    hasHandledDeepLink.current = false;
    pendingScrollIndex.current = null;
    setWeekStart(getMonday(new Date()));
    setSelectedIndex(todayDayIndex());
  }, [pathname]);

  const fetchWeek = useCallback(() => {
    setIsLoading(true);
    axiosInstance
      .get<PublicScheduleWeekResponse>(`/public/studios/${studio.id}/schedule`, {
        params: { week_start: formatDate(weekStart) },
      })
      .then((r) => setDays(r.data.days))
      .catch(() => setDays([]))
      .finally(() => setIsLoading(false));
  }, [studio.id, weekStart]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  // Intentionally deps-less: re-measures on every render so the sticky day headers stay
  // pinned correctly if the fixed header's height changes (e.g. studio name wraps to two
  // lines). Safe from update loops — setState bails out when the measured height repeats.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (headerRef.current) setHeaderHeight(headerRef.current.getBoundingClientRect().height);
  });

  // The actual scroll + selection commit. Selection is set explicitly here (rather than
  // relying on a subsequent real scroll event to "discover" the right index via onScroll)
  // because a programmatic "auto" scroll can complete without ever firing a scroll event the
  // sync listener observes — that previously left the strip showing a stale selection after
  // e.g. "Dziś" from a different week. But it's committed only once the scroll has actually
  // settled, not the instant the scroll starts, and not after a guessed fixed delay either —
  // a fixed timeout (originally 500ms) undershoots a native "smooth" scroll spanning many
  // days (e.g. Monday → Sunday takes noticeably longer than an adjacent-day tap), so it fired
  // the commit while the browser was still mid-animation, then got corrected once real scroll
  // events caught up — a visible "right day → wrong day → right day" flicker. armSettleCommit
  // instead re-arms on every scroll event and only commits once scrolling has genuinely gone
  // quiet, so it adapts to any distance/duration automatically. latestScrollTarget guards
  // against a rapid second tap: if a newer scroll was requested before this one settles, this
  // stale commit is skipped so it can't overwrite the newer target.
  const latestScrollTarget = useRef<number | null>(null);
  const scrollSettleTimer = useRef<number | null>(null);

  const armSettleCommit = useCallback((index: number) => {
    if (scrollSettleTimer.current != null) window.clearTimeout(scrollSettleTimer.current);
    scrollSettleTimer.current = window.setTimeout(() => {
      if (latestScrollTarget.current === index) {
        setSelectedIndex(index);
        suppressScrollSync.current = false;
      }
    }, 150);
  }, []);

  const performScroll = useCallback(
    (index: number, behavior: ScrollBehavior) => {
      const el = sectionRefs.current[index];
      if (!el) return;
      latestScrollTarget.current = index;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior });
      // Arms the settle timer immediately too (not just from the scroll listener below) to
      // cover the rare zero-distance case — e.g. re-tapping the already-selected day — where
      // scrollTo triggers no scroll event at all to drive the debounce.
      armSettleCommit(index);
    },
    [headerHeight, armSettleCommit],
  );

  // Deferred two animation frames so this runs after any scroll position the browser or
  // Next.js's own client-side-navigation scroll-restoration sets — otherwise a same-tick
  // programmatic scroll gets silently stomped back to the top when this page is reached via
  // <Link> (client-side nav) rather than a direct URL load/hard navigation.
  //
  // suppressScrollSync is set here (synchronously, the moment a scroll is *decided*) rather
  // than inside performScroll — otherwise the scroll-sync effect's own initial onScroll()
  // read, which runs synchronously in the same commit as this call, would still see
  // suppressScrollSync as false (since performScroll hasn't executed yet, deferred by the two
  // rAFs below) and briefly select whatever's actually still scrolled into view (day 0) before
  // the deferred scroll lands — a visible flash/jump to the wrong day on load.
  const scrollToDay = useCallback(
    (index: number, behavior: ScrollBehavior) => {
      suppressScrollSync.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performScroll(index, behavior);
        });
      });
    },
    [performScroll],
  );

  // Decide the initial landing day exactly once, the first time data finishes loading:
  // honor the class-landing CTA's deep link (?class=<slug>, brief §7) if present and it
  // matches a session this week, otherwise default to today. Must run (and set
  // pendingScrollIndex) before the "consume pending scroll" effect below on the same
  // commit, so it's declared first.
  useEffect(() => {
    if (hasHandledDeepLink.current || isLoading) return;
    hasHandledDeepLink.current = true;
    const classSlug = searchParams.get("class");
    const idx = classSlug ? findEarliestDayIndexForClass(days, classSlug) : todayDayIndex();
    if (idx != null) {
      pendingScrollIndex.current = idx;
    }
  }, [isLoading, days, searchParams]);

  // Run any pending scroll (from week change / "Dziś" / initial landing) once the new
  // week's sections are laid out.
  useEffect(() => {
    if (isLoading) return;
    if (pendingScrollIndex.current == null) return;
    const idx = pendingScrollIndex.current;
    pendingScrollIndex.current = null;
    scrollToDay(idx, "auto");
  }, [isLoading, days, headerHeight, scrollToDay]);

  // Scroll body -> update strip selection: the selected day is the last section whose
  // sticky header has scrolled up to (or past) the pin line under the fixed header.
  useEffect(() => {
    function onScroll() {
      if (suppressScrollSync.current) {
        // A programmatic scroll is still in flight — keep re-arming the settle timer as long
        // as scroll events keep arriving, so the eventual commit waits for genuine rest
        // instead of a guessed duration (see armSettleCommit).
        const target = latestScrollTarget.current;
        if (target != null) armSettleCommit(target);
        return;
      }
      if (!headerHeight || days.length === 0) return;
      let next = -1;
      for (let i = 0; i < sectionRefs.current.length; i++) {
        const el = sectionRefs.current[i];
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (window.scrollY + headerHeight + 1 >= top) next = i;
      }
      // No section has actually scrolled up to the pin line yet (e.g. the day sections
      // haven't rendered/laid out on this pass) — nothing meaningful to sync, so don't
      // default to day 0. This previously caused a visible flash to Monday on load, before
      // the correct day's pending scroll had a chance to execute.
      if (next === -1) return;
      setSelectedIndex((prev) => (prev === next ? prev : next));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [headerHeight, days, armSettleCommit]);

  useEffect(() => {
    return () => {
      if (scrollSettleTimer.current != null) window.clearTimeout(scrollSettleTimer.current);
    };
  }, []);

  function handleSelectDay(index: number) {
    scrollToDay(index, "smooth");
  }

  function goToToday() {
    const currentMonday = getMonday(new Date());
    const isCurrentWeek = formatDate(weekStart) === formatDate(currentMonday);
    const idx = todayDayIndex();
    if (isCurrentWeek) {
      scrollToDay(idx, "smooth");
    } else {
      pendingScrollIndex.current = idx;
      setWeekStart(currentMonday);
    }
  }

  function shiftWeek(deltaDays: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + deltaDays);
    setSelectedIndex(0);
    pendingScrollIndex.current = 0;
    setWeekStart(d);
  }

  const sessionCounts = days.map((d) => d.session_count);
  const todayStr = formatDate(new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      <div ref={headerRef} className="sticky top-0 z-30 border-b bg-white">
        <ScheduleHeaderIdentity studio={studio} />

        <div className="flex items-center px-4 pt-3">
          <button
            onClick={goToToday}
            className="shrink-0 rounded-md border bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dziś
          </button>
          <div className="flex flex-1 items-center justify-end gap-1">
            <button
              onClick={() => dayStripRef.current?.goToPreviousWeek()}
              className="rounded p-1 hover:bg-gray-100"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => dayStripRef.current?.goToNextWeek()}
              className="rounded p-1 hover:bg-gray-100"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          <DayStrip
            ref={dayStripRef}
            weekStart={weekStart}
            sessionCounts={sessionCounts}
            selectedIndex={selectedIndex}
            isLoading={isLoading}
            onSelectDay={handleSelectDay}
            onShiftWeek={shiftWeek}
          />
        </div>
      </div>

      {isLoading && days.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Ładowanie...</p>
      ) : (
        <div className="pb-8">
          {days.map((day, i) => (
            <div
              key={day.date}
              ref={(el) => {
                sectionRefs.current[i] = el;
              }}
            >
              <div
                className={cn(
                  "sticky z-20 border-b bg-white px-4 py-3 text-center text-lg font-bold capitalize",
                  day.date < todayStr ? "text-gray-400" : "text-gray-900",
                )}
                style={{ top: headerHeight }}
              >
                {formatDayHeader(day.date)}
              </div>
              <div className="space-y-2 px-4 py-3">
                {day.occurrences.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">Brak zajęć</p>
                ) : (
                  day.occurrences.map((occ) => (
                    <SessionCard key={occ.id} occ={occ} onClick={setSelectedOcc} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SessionDetailModal
        occ={selectedOcc}
        onClose={() => setSelectedOcc(null)}
        onBookingCancelled={fetchWeek}
      />
    </div>
  );
}

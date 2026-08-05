"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  DayStrip,
  type DayStripHandle,
} from "@/app/(public)/studio/[slug]/schedule/components/DayStrip";
import { SessionCard } from "@/app/(public)/studio/[slug]/schedule/components/SessionCard";
import { SessionDetailDrawer } from "@/app/(public)/studio/[slug]/schedule/SessionDetailDrawer";
import type { PublicScheduleDaySummary } from "@/app/(public)/studio/[slug]/schedule/types";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { InstructorPublic } from "@/types/instructor";

import type { InstructorPublicScheduleWeekResponse } from "./types";

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

function findEarliestDayIndexForClass(
  days: PublicScheduleDaySummary[],
  classSlug: string,
): number | null {
  for (let i = 0; i < days.length; i++) {
    if (days[i].occurrences.some((o) => o.class_slug === classSlug)) return i;
  }
  return null;
}

function ScheduleHeaderIdentity({ instructor }: { instructor: InstructorPublic }) {
  return (
    <Link href={`/instruktor/${instructor.slug}`} className="flex items-start gap-3 px-4 pt-4">
      <HashedAvatar
        seed={instructor.id}
        name={instructor.name}
        imageId={instructor.image_id}
        size={60}
      />
      <div className="min-w-0 pt-[6px]">
        <p className=" font-bold leading-tight text-gray-900 text-lg">{instructor.name}</p>
        <p className="mt-0.5 truncate text-sm text-gray-500">nauczyciel jogi</p>
      </div>
    </Link>
  );
}

/** Mirrors StudioSchedulePage.tsx exactly (see that file's extensive comments for the
 * scroll-sync/settle-timer rationale), swapped to the instructor-scoped endpoints from T01
 * and rendering studio identity on session cards (context="instructor") instead of
 * instructor identity. Deliberately a parallel component rather than a generalized shared
 * one — StudioSchedulePage's scroll timing logic is delicate and already live; forcing a
 * dual-entity abstraction onto it would add risk disproportionate to the benefit. */
export function InstructorSchedulePage({ instructor }: { instructor: InstructorPublic }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [days, setDays] = useState<PublicScheduleDaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(() => todayDayIndex());
  const [headerHeight, setHeaderHeight] = useState(0);

  const dayStripRef = useRef<DayStripHandle>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pendingScrollIndex = useRef<number | null>(null);
  const suppressScrollSync = useRef(false);
  const hasHandledDeepLink = useRef(false);
  const isFirstPathnameEffect = useRef(true);

  useEffect(() => {
    if (isFirstPathnameEffect.current) {
      isFirstPathnameEffect.current = false;
      return;
    }
    hasHandledDeepLink.current = false;
    pendingScrollIndex.current = null;
    setWeekStart(getMonday(new Date()));
    setSelectedIndex(todayDayIndex());
    setSelectedOccurrenceId(null);
  }, [pathname]);

  const fetchWeek = useCallback(() => {
    setIsLoading(true);
    axiosInstance
      .get<InstructorPublicScheduleWeekResponse>(
        `/public/instructors/${instructor.slug}/schedule`,
        {
          params: { week_start: formatDate(weekStart) },
        },
      )
      .then((r) => setDays(r.data.days))
      .catch(() => setDays([]))
      .finally(() => setIsLoading(false));
  }, [instructor.slug, weekStart]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (headerRef.current) setHeaderHeight(headerRef.current.getBoundingClientRect().height);
  });

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
      armSettleCommit(index);
    },
    [headerHeight, armSettleCommit],
  );

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

  useEffect(() => {
    if (hasHandledDeepLink.current || isLoading) return;
    hasHandledDeepLink.current = true;
    const classSlug = searchParams.get("class");
    const idx = classSlug ? findEarliestDayIndexForClass(days, classSlug) : todayDayIndex();
    if (idx != null) {
      pendingScrollIndex.current = idx;
    }
  }, [isLoading, days, searchParams]);

  useEffect(() => {
    if (isLoading) return;
    if (pendingScrollIndex.current == null) return;
    const idx = pendingScrollIndex.current;
    pendingScrollIndex.current = null;
    scrollToDay(idx, "auto");
  }, [isLoading, days, headerHeight, scrollToDay]);

  useEffect(() => {
    function onScroll() {
      if (suppressScrollSync.current) {
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
    pendingScrollIndex.current = selectedIndex;
    setWeekStart(d);
  }

  const sessionCounts = days.map((d) => d.session_count);
  const todayStr = formatDate(new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      <div ref={headerRef} className="sticky top-0 z-30 border-b bg-white">
        <ScheduleHeaderIdentity instructor={instructor} />

        <div className="px-4 pt-4 pb-[5px]">
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
        <div className="pb-24">
          {days.map((day, i) => (
            <div
              key={day.date}
              ref={(el) => {
                sectionRefs.current[i] = el;
              }}
            >
              <div
                className={cn(
                  "sticky z-20 border-b bg-white px-4 py-2 text-center text-lg font-bold capitalize",
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
                    <SessionCard
                      key={occ.id}
                      occ={occ}
                      context="instructor"
                      onClick={(clicked) => setSelectedOccurrenceId(clicked.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={goToToday}
          className="flex h-11 shrink-0 items-center justify-center rounded-[16px] bg-white px-5 text-base font-medium text-gray-900 shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
        >
          Dzisiaj
        </button>
        <div className="flex h-11 items-center gap-1 rounded-[16px] bg-white px-1 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
          <button
            onClick={() => dayStripRef.current?.goToPreviousWeek()}
            className="rounded-[16px] p-2.5 hover:bg-gray-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => dayStripRef.current?.goToNextWeek()}
            className="rounded-[16px] p-2.5 hover:bg-gray-100"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <SessionDetailDrawer
        occurrenceId={selectedOccurrenceId}
        onClose={() => setSelectedOccurrenceId(null)}
        onBookingCancelled={fetchWeek}
      />
    </div>
  );
}

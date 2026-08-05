"use client";

import { ChevronLeft, ChevronRight, Coffee } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { axiosInstance } from "@/lib/axiosInstance";

import type { DayStripHandle } from "../components/DayStrip";
import { DayStrip } from "../components/DayStrip";
import { GrafikContextChips } from "../components/GrafikContextChips";
import { GrafikSessionCard } from "../components/GrafikSessionCard";
import type { ScheduleOccurrence } from "../types";

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

/** "Poniedziałek, 13 lipca" — matches the owner Grafik's day header. */
function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function InstructorSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { capabilities, isLoading: isLoadingCapabilities } = usePartnerCapabilities();

  // Nothing to show read-only for a partner with no accepted teaching links — send
  // them back to the managed-owner view (which itself redirects on to Rezerwacje for
  // a partner with neither, per spec-b2b §3).
  useEffect(() => {
    if (isLoadingCapabilities || !capabilities) return;
    if (capabilities.teachingStudios.length === 0) {
      router.replace("/konto/partner/grafik");
    }
  }, [isLoadingCapabilities, capabilities, router]);

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [occurrences, setOccurrences] = useState<ScheduleOccurrence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeek = useCallback(() => {
    setIsLoading(true);
    axiosInstance
      .get<ScheduleOccurrence[]>("/class-grafik/instructor", {
        params: { week_start: formatDate(weekStart) },
      })
      .then((r) => setOccurrences(r.data ?? []))
      .catch(() =>
        toast({ description: "Nie udało się załadować grafiku.", variant: "destructive" }),
      )
      .finally(() => setIsLoading(false));
  }, [weekStart, toast]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  const sessionCounts = useMemo(() => {
    const counts = Array(7).fill(0);
    for (const occ of occurrences) {
      const d = new Date(occ.calendar_date + "T00:00:00");
      const dayOfWeek = d.getDay();
      const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      counts[idx]++;
    }
    return counts;
  }, [occurrences]);

  const selectedDate = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + selectedDayIndex);
    return formatDate(d);
  }, [weekStart, selectedDayIndex]);

  const dayOccurrences = useMemo(
    () => occurrences.filter((o) => o.calendar_date === selectedDate),
    [occurrences, selectedDate],
  );

  const dayStripRef = useRef<DayStripHandle>(null);

  // The live window (spec §2.1) must re-evaluate while the screen stays open.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  function shiftWeek(deltaDays: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + deltaDays);
    setWeekStart(d);
  }

  /** Same day-at-a-time stepping as the owner Grafik, rolling into the neighbouring week
   * at the edges. */
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

  // Tapping a card navigates straight to the session screen (spec §1) — same destination as
  // the owner Grafik; T01's role resolver decides there whether this caller gets the owner
  // screen (§3) or the read-only variant (§8). No fallback studio here (unlike the owner
  // Grafik's `useCurrentStudio()`): an instructor's assignment carries its own studio_id, and
  // there is no "current studio" concept to fall back to for a teaching-only partner.
  function goToSession(occ: ScheduleOccurrence) {
    if (!occ.studio_id) return;
    router.push(`/konto/partner/studio/${occ.studio_id}/front-desk/${occ.id}`);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--dashboard-header-h)-7rem)] max-w-lg flex-col px-4 pt-4 md:min-h-[calc(100dvh-var(--dashboard-header-h))]">
      <GrafikContextChips />

      <DayStrip
        ref={dayStripRef}
        weekStart={weekStart}
        sessionCounts={sessionCounts}
        selectedIndex={selectedDayIndex}
        isLoading={isLoading}
        onSelectDay={setSelectedDayIndex}
        onShiftWeek={shiftWeek}
      />

      {/* Selected-day title + day chevrons below the strip, matching the owner Grafik. */}
      <div className="flex items-center justify-between gap-3 pt-2">
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

      {/* `flex-1` + the page's bottom padding so the swipe area covers the whitespace under
       * a short day, not just the cards. */}
      <div className="mt-4 flex-1 pb-4" {...daySwipe}>
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Ładowanie...</p>
        ) : dayOccurrences.length === 0 ? (
          <div className="rounded-b2b border border-dashed bg-gray-50 py-8 px-4 text-center space-y-2">
            <Coffee size={20} className="mx-auto text-gray-400" />
            <p className="text-sm text-gray-500">Wolne — dziś nie prowadzisz zajęć</p>
          </div>
        ) : (
          // Separated cards, same as the owner Grafik and the public studio schedule.
          <div className="space-y-2">
            {dayOccurrences.map((occ) => (
              <GrafikSessionCard
                key={occ.id}
                occ={occ}
                onClick={goToSession}
                context="instructor"
                now={now}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

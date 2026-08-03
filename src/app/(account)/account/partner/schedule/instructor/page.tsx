"use client";

import { Calendar, ChevronLeft, ChevronRight, Clock, Coffee, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
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

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
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
  const [panelOcc, setPanelOcc] = useState<ScheduleOccurrence | null>(null);

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
                onClick={setPanelOcc}
                context="instructor"
              />
            ))}
          </div>
        )}
      </div>

      <Drawer open={!!panelOcc} onOpenChange={(open) => !open && setPanelOcc(null)}>
        <DrawerContent>
          {panelOcc && (
            <div className="px-4 pb-6">
              <DrawerHeader className="px-0">
                <DrawerTitle>{panelOcc.template_title}</DrawerTitle>
                {panelOcc.studio_name && (
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {panelOcc.studio_name}
                  </Badge>
                )}
              </DrawerHeader>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={14} className="text-gray-400" />
                  <span>
                    {formatTime(panelOcc.start_time)} – {formatTime(panelOcc.end_time)}
                  </span>
                </div>
                {panelOcc.room_name && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{panelOcc.room_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Users size={14} className="text-gray-400" />
                  <span>
                    {panelOcc.fill_count}
                    {panelOcc.capacity ? ` / ${panelOcc.capacity}` : ""} zapisanych
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-6 flex items-center gap-1">
                ℹ To grafik studia. Zmiany w sesji wprowadza właściciel / manager studia.
              </p>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

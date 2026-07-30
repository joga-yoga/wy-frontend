"use client";

import { Calendar, ChevronLeft, ChevronRight, Clock, Coffee, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
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

function formatWeekRangeLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const startDay = weekStart.getDate();
  const endDay = end.getDate();
  const startMonth = weekStart.toLocaleDateString("pl-PL", { month: "long" });
  const endMonth = end.toLocaleDateString("pl-PL", { month: "long" });
  if (startMonth !== endMonth) return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
  return `${startDay} – ${endDay} ${startMonth}`;
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

  return (
    <div className="p-4 mx-auto max-w-lg min-h-screen">
      <GrafikContextChips />

      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-semibold text-gray-900 capitalize">
          {formatWeekRangeLabel(weekStart)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => dayStripRef.current?.goToPreviousWeek()}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => dayStripRef.current?.goToNextWeek()}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <DayStrip
        ref={dayStripRef}
        weekStart={weekStart}
        sessionCounts={sessionCounts}
        selectedIndex={selectedDayIndex}
        isLoading={isLoading}
        onSelectDay={setSelectedDayIndex}
        onShiftWeek={shiftWeek}
      />

      <div className="mt-4">
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Ładowanie...</p>
        ) : dayOccurrences.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-gray-50 py-8 px-4 text-center space-y-2">
            <Coffee size={20} className="mx-auto text-gray-400" />
            <p className="text-sm text-gray-500">Wolne — dziś nie prowadzisz zajęć</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[15px] font-semibold text-gray-900">
              {formatDayHeader(selectedDate)}
            </p>
            {/* Same single-container-with-dividers treatment as the owner Grafik (C1):
             * `GrafikSessionCard` is a row and carries no border of its own. */}
            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border bg-white">
              {dayOccurrences.map((occ) => (
                <GrafikSessionCard
                  key={occ.id}
                  occ={occ}
                  onClick={setPanelOcc}
                  context="instructor"
                />
              ))}
            </div>
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

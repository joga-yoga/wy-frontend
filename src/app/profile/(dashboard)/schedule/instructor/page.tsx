"use client";

import { Calendar, ChevronLeft, ChevronRight, Clock, Coffee, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { DayStrip } from "../components/DayStrip";
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

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const s = weekStart.toLocaleDateString("pl-PL", { day: "numeric" });
  const e = end.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  return `${s}–${e}`;
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "short" });
}

export default function InstructorSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();

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
      .catch(() => toast({ description: "Nie udało się załadować grafiku.", variant: "destructive" }))
      .finally(() => setIsLoading(false));
  }, [weekStart, toast]);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

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
    [occurrences, selectedDate]
  );

  return (
    <div className="p-4 mx-auto max-w-lg min-h-screen">
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium">{formatWeekRange(weekStart)}</span>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      <DayStrip
        weekStart={weekStart}
        sessionCounts={sessionCounts}
        selectedIndex={selectedDayIndex}
        onSelect={setSelectedDayIndex}
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
            <p className="text-sm font-semibold text-gray-700 capitalize">
              {formatDayHeader(selectedDate)}
            </p>
            {dayOccurrences.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setPanelOcc(occ)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-mono text-gray-500 w-12 shrink-0">
                  {formatTime(occ.start_time)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{occ.template_title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {occ.studio_name && `${occ.studio_name} · `}
                    {[occ.room_name].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {occ.capacity && (
                  <Badge className="text-[10px] bg-green-100 text-green-700">
                    {occ.fill_count} zapisanych
                  </Badge>
                )}
              </button>
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
                  <span>{formatTime(panelOcc.start_time)} – {formatTime(panelOcc.end_time)}</span>
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

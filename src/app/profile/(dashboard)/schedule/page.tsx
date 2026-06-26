"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  User,
  Users,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { DayStrip } from "./components/DayStrip";
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

function formatMonthTitle(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const startMonth = weekStart.toLocaleDateString("pl-PL", { month: "long" });
  const endMonth = end.toLocaleDateString("pl-PL", { month: "long" });
  const startYear = weekStart.getFullYear();
  const endYear = end.getFullYear();
  if (startYear !== endYear) return `${startMonth} ${startYear} – ${endMonth} ${endYear}`;
  if (startMonth !== endMonth) return `${startMonth}–${endMonth} ${startYear}`;
  return `${startMonth} ${startYear}`;
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "short" });
}

export default function GrafikPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const studioParam = searchParams.get("studio_id") ?? "";
  const [studioId, setStudioId] = useState(studioParam);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [days, setDays] = useState<ScheduleDaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [panelOcc, setPanelOcc] = useState<ScheduleOccurrence | null>(null);

  useEffect(() => {
    axiosInstance
      .get<{ id: string; name: string }[]>("/studios")
      .then((r) => {
        if (!studioId && r.data?.length) setStudioId(r.data[0].id);
      })
      .catch(() => {});
  }, [studioId]);

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

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  return (
    <div className="p-4 mx-auto max-w-lg min-h-screen">
      {/* Week stepper */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => {
            const today = new Date();
            setWeekStart(getMonday(today));
            const dow = today.getDay();
            setSelectedDayIndex(dow === 0 ? 6 : dow - 1);
          }}
          className="px-3 py-1.5 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 shrink-0"
        >
          Dziś
        </button>
        <span className="flex-1 text-center text-sm font-medium capitalize">
          {formatMonthTitle(weekStart)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={prevWeek} className="p-1 rounded hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextWeek} className="p-1 rounded hover:bg-gray-100">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day strip */}
      <DayStrip
        weekStart={weekStart}
        sessionCounts={sessionCounts}
        selectedIndex={selectedDayIndex}
        onSelect={setSelectedDayIndex}
      />

      {/* Day content */}
      <div className="mt-4">
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Ładowanie...</p>
        ) : !hasAnySessions ? (
          <div className="rounded-xl border border-dashed bg-gray-50 py-8 px-4 text-center space-y-3">
            <Calendar size={24} className="mx-auto text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Grafik jest pusty</p>
            <p className="text-xs text-gray-500">
              Dodaj pierwsze zajęcia, żeby zbudować cotygodniowy grafik.
            </p>
            <Link href="/profile/class-schedules/create">
              <Button variant="outline" size="sm">
                <Plus size={14} className="mr-1" />
                Dodaj zajęcia
              </Button>
            </Link>
          </div>
        ) : selectedDay && selectedDay.session_count === 0 ? (
          <div className="rounded-xl border border-dashed bg-gray-50 py-8 px-4 text-center space-y-3">
            <Calendar size={20} className="mx-auto text-gray-400" />
            {selectedDay.date < formatDate(new Date()) ? (
              <p className="text-sm text-gray-500">Nie było zajęć w ten dzień</p>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Brak zajęć w {formatDayHeader(selectedDay.date).split(",")[0]}
                </p>
                <Link href="/profile/class-schedules/create">
                  <Button variant="outline" size="sm">
                    <Plus size={14} className="mr-1" />
                    Dodaj zajęcia
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : selectedDay ? (
          <div className="space-y-3">
            {/* Day header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 capitalize">
                {formatDayHeader(selectedDay.date)}
              </p>
              <span className="text-xs text-gray-500">
                {selectedDay.session_count} {selectedDay.session_count === 1 ? "zajęcia" : "zajęć"}
              </span>
            </div>

            {/* Session cards */}
            {selectedDay.occurrences.map((occ) => {
              const isCancelled = occ.status === "cancelled";
              const fillColor =
                occ.capacity && occ.fill_count >= occ.capacity
                  ? "bg-red-100 text-red-700"
                  : occ.capacity && occ.fill_count >= occ.capacity * 0.8
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700";

              return (
                <button
                  key={occ.id}
                  onClick={() => setPanelOcc(occ)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border bg-white hover:bg-gray-50 transition-colors ${
                    isCancelled ? "opacity-60" : ""
                  }`}
                >
                  <div className="text-sm font-mono text-gray-500 w-12 shrink-0">
                    {formatTime(occ.start_time)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold text-gray-900 truncate ${isCancelled ? "line-through" : ""}`}
                    >
                      {occ.template_title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {[occ.room_name, occ.instructor_name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {occ.is_modified && !isCancelled && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                        <Pencil size={10} />
                        wyjątek
                      </span>
                    )}
                    {isCancelled ? (
                      <Badge variant="destructive" className="text-[10px]">
                        odwołane
                      </Badge>
                    ) : occ.capacity ? (
                      <Badge className={`text-[10px] ${fillColor}`}>
                        {occ.fill_count}/{occ.capacity}
                      </Badge>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* FAB */}
      {hasAnySessions && (
        <Link
          href="/profile/class-schedules/create"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={24} />
        </Link>
      )}

      {/* Session panel drawer */}
      <Drawer open={!!panelOcc} onOpenChange={(open) => !open && setPanelOcc(null)}>
        <DrawerContent>
          {panelOcc && (
            <div className="px-4 pb-6">
              <DrawerHeader className="px-0">
                <DrawerTitle>{panelOcc.template_title}</DrawerTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDayHeader(panelOcc.calendar_date)} · {formatTime(panelOcc.start_time)} –{" "}
                  {formatTime(panelOcc.end_time)}
                </p>
                {panelOcc.status !== "cancelled" && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    Część serii
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
                {panelOcc.instructor_name && (
                  <div className="flex items-center gap-3 text-sm">
                    <User size={14} className="text-gray-400" />
                    <span>{panelOcc.instructor_name}</span>
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

              {panelOcc.status !== "cancelled" && (
                <div className="space-y-2 mt-6">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/profile/schedule/edit/${panelOcc.id}`}>
                      <Pencil size={14} className="mr-2" />
                      Edytuj
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/profile/schedule/edit/${panelOcc.id}?field=instructor`}>
                      <RefreshCw size={14} className="mr-2" />
                      Zmień prowadzącego
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    asChild
                  >
                    <Link href={`/profile/schedule/cancel/${panelOcc.id}`}>
                      <XIcon size={14} className="mr-2" />
                      Odwołaj
                    </Link>
                  </Button>
                </div>
              )}

              {panelOcc.status === "cancelled" && panelOcc.notified_count > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  {panelOcc.notified_count} osób powiadomionych
                </p>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

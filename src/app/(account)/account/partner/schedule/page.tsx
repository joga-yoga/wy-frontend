"use client";

import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  User,
  Users,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

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

function formatWeekRangeLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const startDay = weekStart.getDate();
  const endDay = end.getDate();
  const startMonth = weekStart.toLocaleDateString("pl-PL", { month: "long" });
  const endMonth = end.toLocaleDateString("pl-PL", { month: "long" });
  const startYear = weekStart.getFullYear();
  const endYear = end.getFullYear();
  if (startYear !== endYear)
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  if (startMonth !== endMonth) return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
  return `${startDay} – ${endDay} ${startMonth}`;
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "short" });
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { capabilities, isLoading: isLoadingCapabilities } = usePartnerCapabilities();

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
  const [panelOcc, setPanelOcc] = useState<ScheduleOccurrence | null>(null);
  const [reconciliation, setReconciliation] = useState<{
    total: number;
    showStudioLabels: boolean;
    studioName: string | null;
  }>({ total: 0, showStudioLabels: false, studioName: null });

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
          total: data.total,
          showStudioLabels: data.show_studio_labels,
          // Only unambiguous when every flagged session belongs to the same studio —
          // a mixed set gets its per-session labels in the reconciliation list instead.
          studioName: distinctStudioNames.length === 1 ? (distinctStudioNames[0] as string) : null,
        });
      })
      .catch(() => setReconciliation({ total: 0, showStudioLabels: false, studioName: null }));
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

  const dayStripRef = useRef<DayStripHandle>(null);

  function shiftWeek(deltaDays: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + deltaDays);
    setWeekStart(d);
  }

  return (
    <div className="p-4 mx-auto max-w-lg min-h-screen">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Grafik</h1>

      <GrafikContextChips />

      {reconciliation.total > 0 && (
        <Link
          href="/konto/partner/rozliczenia"
          className="mb-4 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {reconciliation.total} {reconciliation.total === 1 ? "sesja" : "sesje"} do rozliczenia
            {reconciliation.showStudioLabels && reconciliation.studioName && (
              <> · {reconciliation.studioName}</>
            )}
          </span>
          <ChevronRight size={16} />
        </Link>
      )}

      {/* Week stepper */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900 capitalize">
            {formatWeekRangeLabel(weekStart)}
          </span>
          <button
            onClick={() => {
              const today = new Date();
              setWeekStart(getMonday(today));
              const dow = today.getDay();
              setSelectedDayIndex(dow === 0 ? 6 : dow - 1);
            }}
            className="rounded-lg border px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            Dziś
          </button>
        </div>
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

      {/* Day strip */}
      <DayStrip
        ref={dayStripRef}
        weekStart={weekStart}
        sessionCounts={sessionCounts}
        selectedIndex={selectedDayIndex}
        isLoading={isLoading}
        onSelectDay={setSelectedDayIndex}
        onShiftWeek={shiftWeek}
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
            <Link href="/konto/partner/grafiki-zajec/create">
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
            <div className="space-y-2.5">
              {selectedDay.occurrences.map((occ) => (
                <GrafikSessionCard key={occ.id} occ={occ} onClick={setPanelOcc} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* FAB */}
      {hasAnySessions && (
        <Link
          href="/konto/partner/grafiki-zajec/create"
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
                    <Link href={`/konto/partner/grafik/edit/${panelOcc.id}`}>
                      <Pencil size={14} className="mr-2" />
                      Edytuj
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/konto/partner/grafik/edit/${panelOcc.id}?field=instructor`}>
                      <RefreshCw size={14} className="mr-2" />
                      Zmień prowadzącego
                    </Link>
                  </Button>
                  {panelOcc.studio_id && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link
                        href={`/konto/partner/studio/${panelOcc.studio_id}/front-desk/${panelOcc.id}`}
                      >
                        <ClipboardList size={14} className="mr-2" />
                        Lista obecności
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    asChild
                  >
                    <Link href={`/konto/partner/grafik/cancel/${panelOcc.id}`}>
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

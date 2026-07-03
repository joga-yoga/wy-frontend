"use client";

import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DayStrip } from "@/app/profile/(dashboard)/schedule/components/DayStrip";
import { WyImage } from "@/components/custom/WyImage";
import { axiosInstance } from "@/lib/axiosInstance";
import type { StudioPublic } from "@/types/studio";

import { SessionDetailModal } from "./SessionDetailModal";
import type { PublicOccurrence, PublicScheduleWeekResponse } from "./types";

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

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StudioCompactHeader({ studio }: { studio: StudioPublic }) {
  const [showAllStyles, setShowAllStyles] = useState(false);
  const styles = studio.yoga_styles ?? [];

  return (
    <div className="border-b bg-white px-4 py-4">
      <Link
        href={`/studio/${studio.slug}`}
        className="mb-3 flex items-center gap-1.5 text-sm text-gray-500"
      >
        <ChevronLeft className="h-4 w-4" />
        Wróć
      </Link>

      <div className="flex items-center gap-3">
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
          <p className="font-bold leading-tight text-gray-900">{studio.name}</p>
          {studio.address && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0" />
              {studio.address}
            </p>
          )}
        </div>
      </div>

      {styles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(showAllStyles ? styles : styles.slice(0, 3)).map((s) => (
            <span
              key={s.id}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              {s.name}
            </span>
          ))}
          {!showAllStyles && styles.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllStyles(true)}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
            >
              +{styles.length - 3}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function StudioSchedulePage({ studio }: { studio: StudioPublic }) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [days, setDays] = useState<PublicScheduleWeekResponse["days"]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOcc, setSelectedOcc] = useState<PublicOccurrence | null>(null);

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

  const sessionCounts = useMemo(() => days.map((d) => d.session_count), [days]);
  const selectedDay = days[selectedDayIndex];

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
  const goToToday = () => {
    const today = new Date();
    setWeekStart(getMonday(today));
    const dow = today.getDay();
    setSelectedDayIndex(dow === 0 ? 6 : dow - 1);
  };

  return (
    <div className="min-h-screen bg-white">
      <StudioCompactHeader studio={studio} />

      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-4 flex items-center">
          <button
            onClick={goToToday}
            className="shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dziś
          </button>
          <span className="flex-1 text-center text-sm font-medium capitalize">
            {formatMonthTitle(weekStart)}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={prevWeek} className="rounded p-1 hover:bg-gray-100">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextWeek} className="rounded p-1 hover:bg-gray-100">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <DayStrip
          weekStart={weekStart}
          sessionCounts={sessionCounts}
          selectedIndex={selectedDayIndex}
          onSelect={setSelectedDayIndex}
        />

        <div className="mt-4 pb-8">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-gray-400">Ładowanie...</p>
          ) : !selectedDay || selectedDay.session_count === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Brak zajęć w ten dzień.</p>
          ) : (
            <div>
              <p className="mb-3 text-sm font-semibold capitalize text-gray-700">
                {formatDayHeader(selectedDay.date)}
              </p>
              <div className="divide-y divide-gray-100">
                {selectedDay.occurrences.map((occ) => (
                  <button
                    key={occ.id}
                    onClick={() => setSelectedOcc(occ)}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <div className="w-12 shrink-0 font-mono text-sm text-gray-500">
                      {formatTime(occ.start_time)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {occ.template_title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {[occ.room_name, occ.instructor_name].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SessionDetailModal occ={selectedOcc} onClose={() => setSelectedOcc(null)} />
    </div>
  );
}

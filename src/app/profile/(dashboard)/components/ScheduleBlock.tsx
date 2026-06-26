"use client";

import { Calendar, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";

interface ScheduleOccurrence {
  id: string;
  start_time: string;
  end_time: string;
  template_title: string;
  instructor_name?: string | null;
  room_name?: string | null;
  fill_count: number;
  capacity?: number | null;
  status: string;
  studio_id?: string | null;
  studio_name?: string | null;
}

interface ActivityResponse {
  mode: "owner" | "teacher" | "none";
  studio_ids: string[];
  today_sessions: ScheduleOccurrence[];
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function todayLabel(): string {
  return new Date()
    .toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();
}

export function ScheduleBlock() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<ActivityResponse>("/class-grafik/aktivnost")
      .then((r) => setData(r.data))
      .catch(() => setData({ mode: "none", studio_ids: [], today_sessions: [] }))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return null;
  if (!data) return null;

  if (data.mode === "none") {
    return (
      <section>
        <div className="flex items-center gap-2 px-1 py-2 text-xs text-gray-400">
          <Calendar size={14} />
          <span>
            Prowadzisz zajęcia w studiu?{" "}
            <Link href="/profile/studio/create" className="text-blue-600 hover:underline">
              Dodaj studio
            </Link>
            , żeby widzieć swój grafik.
          </span>
        </div>
      </section>
    );
  }

  if (data.mode === "owner") {
    const sessions = data.today_sessions.filter((s) => s.status !== "cancelled");

    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Dziś w studiu · {todayLabel()}
        </h2>

        {data.today_sessions.length === 0 && sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-gray-50 py-6 px-4 text-center space-y-2">
            <p className="text-sm font-semibold text-gray-900">Grafik jest pusty</p>
            <p className="text-xs text-gray-500">
              Dodaj zajęcia, żeby zbudować cotygodniowy grafik.
            </p>
            <Link href="/profile/class-schedules/create">
              <Button variant="outline" size="sm" className="mt-1">
                <Plus size={14} className="mr-1" />
                Dodaj zajęcia
              </Button>
            </Link>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border bg-white px-4 py-4">
            <p className="text-sm text-gray-500">Dziś nie ma zajęć.</p>
          </div>
        ) : (
          <div className="divide-y rounded-xl border bg-white overflow-hidden">
            {sessions.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="text-sm font-mono text-gray-500 w-12 shrink-0">
                  {formatTime(s.start_time)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.template_title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {[s.room_name, s.instructor_name].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {s.capacity && (
                  <Badge
                    className={`text-[10px] ${
                      s.fill_count >= s.capacity
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {s.fill_count}/{s.capacity}
                  </Badge>
                )}
              </div>
            ))}
            {sessions.length > 3 && (
              <div className="px-4 py-2 text-xs text-gray-500 text-center">
                + {sessions.length - 3} więcej
              </div>
            )}
          </div>
        )}

        <Link href="/profile/schedule" className="block">
          <Button variant="outline" className="w-full text-sm">
            <Calendar size={14} className="mr-2" />
            Zarządzaj grafikiem
          </Button>
        </Link>
      </section>
    );
  }

  // mode === "teacher"
  const sessions = data.today_sessions.filter((s) => s.status !== "cancelled");

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Mój grafik · Dziś · {todayLabel()}
      </h2>

      {sessions.length === 0 ? (
        <div className="rounded-xl border bg-white px-4 py-4">
          <p className="text-sm text-gray-500">Dziś nie prowadzisz zajęć.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="text-sm font-mono text-gray-500 w-12 shrink-0">
                {formatTime(s.start_time)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{s.template_title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {s.studio_name && `${s.studio_name} · `}
                  {[s.room_name, s.instructor_name].filter(Boolean).join(" · ")}
                </p>
              </div>
              {s.capacity && (
                <Badge className="text-[10px] bg-green-100 text-green-700">
                  {s.fill_count} zapisanych
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <Link href="/profile/schedule/instructor" className="block">
        <Button variant="outline" className="w-full text-sm">
          <Calendar size={14} className="mr-2" />
          Zobacz mój grafik
        </Button>
      </Link>
    </section>
  );
}

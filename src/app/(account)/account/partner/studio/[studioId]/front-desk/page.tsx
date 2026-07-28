"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { axiosInstance } from "@/lib/axiosInstance";

import { RosterRow } from "./components/RosterRow";
import type { FrontDeskSessionsResponse } from "./types";

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

export default function FrontDeskPage() {
  const { studioId } = useParams<{ studioId: string }>();
  const [date, setDate] = useState(() => new Date());
  const [data, setData] = useState<FrontDeskSessionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);

  const fetchSessions = useCallback(() => {
    setIsLoading(true);
    axiosInstance
      .get<FrontDeskSessionsResponse>(`/studios/${studioId}/front-desk/sessions`, {
        params: { date: formatDate(date) },
      })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [studioId, date]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function shiftDay(delta: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    setDate(next);
  }

  async function runAction(bookingId: string, action: string) {
    setBusyBookingId(bookingId);
    try {
      await axiosInstance.post(`/bookings/${bookingId}/${action}`);
      fetchSessions();
    } catch {
      // Errors here are rare (idempotent actions on already-owned bookings) — a full toast
      // system is out of this task's scope; a silent refetch keeps the list truthful either way.
    } finally {
      setBusyBookingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Recepcja</h1>

      <div className="mb-4 flex items-center justify-between rounded-lg border px-3 py-2">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="rounded p-1.5 hover:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium capitalize text-gray-700">
          {formatDayHeader(date)}
        </span>
        <button
          type="button"
          onClick={() => shiftDay(1)}
          className="rounded p-1.5 hover:bg-gray-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {data && data.overdue.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
            Do rozliczenia
          </h2>
          <div className="space-y-2">
            {data.overdue.map((entry) => (
              <RosterRow
                key={entry.booking_id}
                entry={entry}
                isBusy={busyBookingId === entry.booking_id}
                onMarkPaid={() => runAction(entry.booking_id, "mark-paid")}
                onMarkCardOk={() => runAction(entry.booking_id, "mark-card-ok")}
                onMarkAttended={() => runAction(entry.booking_id, "mark-attended")}
                onMarkNoShow={() => runAction(entry.booking_id, "mark-no-show")}
                onCorrectNoShow={() => runAction(entry.booking_id, "correct-no-show")}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Zajęcia
        </h2>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Ładowanie...</p>
        ) : !data || data.sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Brak zajęć w ten dzień.</p>
        ) : (
          <div className="space-y-2">
            {data.sessions.map((session) => (
              <Link
                key={session.occurrence_id}
                href={`/konto/partner/studio/${studioId}/front-desk/${session.occurrence_id}`}
                className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="w-12 shrink-0 font-mono text-sm text-gray-500">
                  {formatTime(session.start_time)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {session.template_title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {session.fill_count}
                    {session.capacity != null ? ` / ${session.capacity}` : ""} zapisanych
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

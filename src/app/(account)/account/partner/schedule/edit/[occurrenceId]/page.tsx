"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";

import { ScheduleRecurrenceForm } from "../../../class-schedules/components/ScheduleRecurrenceForm";
import type { RoomOption } from "../../../class-schedules/types";
import { ScopeOptionCard } from "../../components/ScopeOptionCard";
import { SessionChangesPreview } from "../../components/SessionChangesPreview";
import type {
  SessionDetailResponse,
  SessionEditCommitResponse,
  SessionEditPreviewResponse,
} from "../../types";

type Scope = "single" | "this_and_future" | "whole_series";
type Step = "scope" | "form" | "preview" | "success";

const WEEKDAY_KEYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

function isFewForm(n: number): boolean {
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
}

function sesjeAccusative(n: number): string {
  if (n === 1) return "sesję";
  return isFewForm(n) ? "sesje" : "sesji";
}

function zmienionaForm(n: number): string {
  if (n === 1) return "zmieniona";
  return isFewForm(n) ? "zmienione" : "zmienionych";
}

function nowaForm(n: number): string {
  if (n === 1) return "nowa";
  return isFewForm(n) ? "nowe" : "nowych";
}

function odwolanaForm(n: number): string {
  if (n === 1) return "odwołana";
  return isFewForm(n) ? "odwołane" : "odwołanych";
}

export default function EditSessionPage() {
  const params = useParams<{ occurrenceId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { studio: currentStudio } = useCurrentStudio();

  const isSubstitution = searchParams.get("field") === "instructor";

  const [step, setStep] = useState<Step>("scope");
  const [scope, setScope] = useState<Scope>("single");

  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  const [startTime, setStartTime] = useState("");
  const [roomId, setRoomId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [instructorId, setInstructorId] = useState("");

  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);

  // Recurrence form state
  const [frequency, setFrequency] = useState<"once" | "weekly">("weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const [previewResponse, setPreviewResponse] = useState<SessionEditPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commitResult, setCommitResult] = useState<SessionEditCommitResponse | null>(null);

  useEffect(() => {
    setIsLoadingDetail(true);
    axiosInstance
      .get<SessionDetailResponse>(`/class-sessions/${params.occurrenceId}`)
      .then((r) => {
        const sd = r.data;
        setSessionDetail(sd);

        // Pre-fill form from session detail
        const t = sd.start_time.match(/T(\d{2}):(\d{2})/);
        setStartTime(t ? `${t[1]}:${t[2]}` : "");
        setRoomId(sd.room_id ?? "");
        setCapacity(sd.capacity != null ? String(sd.capacity) : "");
        setInstructorId(sd.instructor_id ?? "");

        const sessionDate = new Date(sd.calendar_date + "T00:00:00");
        setFromDate(sessionDate);
        setSelectedDays([WEEKDAY_KEYS[sessionDate.getDay()]]);

        // Pre-fill series end date from UNTIL
        if (sd.series_to_date) {
          setToDate(new Date(sd.series_to_date + "T00:00:00"));
        }

        // Skip scope step for non-recurring (one-off) series
        if (!sd.is_recurring) {
          setScope("single");
          setStep("form");
        }
      })
      .catch(() => toast({ description: "Nie udało się załadować sesji.", variant: "destructive" }))
      .finally(() => setIsLoadingDetail(false));
  }, [params.occurrenceId, toast]);

  // The "Prowadzący" picker draws from the studio roster, not the partner's own
  // instructors — Zastępstwo explicitly needs pending-link instructors to be
  // selectable too (reception-desk §6), which a partner-owned-only list would
  // silently exclude (e.g. a claimed instructor who joined from another account).
  // Legacy schedules can have a null `studio_id` (never backfilled), so fall back
  // to the studio context the edit screen was reached from.
  useEffect(() => {
    const studioId = sessionDetail?.studio_id || currentStudio?.id;
    if (!studioId) return;
    axiosInstance
      .get<{ items: { id: string; name: string }[] }>(`/studios/${studioId}/roster`)
      .then((r) => setInstructors(r.data.items.map(({ id, name }) => ({ id, name }))))
      .catch(() => {});
  }, [sessionDetail?.studio_id, currentStudio?.id]);

  useEffect(() => {
    if (!sessionDetail?.studio_id) return;
    axiosInstance
      .get<RoomOption[]>(`/studios/${sessionDetail.studio_id}/rooms`)
      .then((r) => setRooms(r.data ?? []))
      .catch(() => {});
  }, [sessionDetail?.studio_id]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      occurrence_id: params.occurrenceId,
      scope,
      // Always send field values; null = explicitly clear
      room_id: roomId || null,
      capacity: capacity ? parseInt(capacity, 10) : null,
      instructor_id: instructorId || null,
    };

    // Time: only send if user set it
    if (startTime) {
      payload.start_time = startTime + ":00";
    }

    // Recurrence fields for series scopes
    if (scope !== "single") {
      if (frequency === "weekly" && selectedDays.length > 0) {
        payload.frequency = "WEEKLY";
        payload.days = selectedDays;
      }
      if (toDate) {
        payload.to_date = toDate.toISOString().slice(0, 10);
      }
    }

    return payload;
  };

  const goToPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const r = await axiosInstance.post<SessionEditPreviewResponse>(
        "/class-sessions/edit/preview",
        buildPayload(),
      );
      setPreviewResponse(r.data);
      setStep("preview");
    } catch {
      toast({ description: "Nie udało się wygenerować podglądu.", variant: "destructive" });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      // Success-screen figures come from this response, never the preview payload
      // (reception-desk §6) — the preview is computed fresh at commit time and can
      // differ from what was shown a moment earlier (e.g. a booking landing between
      // preview and commit).
      const { data } = await axiosInstance.post<SessionEditCommitResponse>(
        "/class-sessions/edit/commit",
        buildPayload(),
      );
      setCommitResult(data);
      setStep("success");
    } catch {
      toast({ description: "Nie udało się zapisać zmian.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="p-4 mx-auto max-w-lg">
        <p className="text-center text-gray-400 py-8">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto max-w-lg">
      {step === "scope" && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-900">
            {isSubstitution ? "Na ile zajęć?" : "Co chcesz zmienić?"}
          </p>
          <div className="space-y-2">
            <ScopeOptionCard
              title="Tylko tę sesję"
              subtitle={isSubstitution ? "Jednorazowe zastępstwo" : "Wyjątek, seria bez zmian"}
              selected={scope === "single"}
              onSelect={() => setScope("single")}
            />
            <ScopeOptionCard
              title="Tę i kolejne"
              subtitle="Od tej daty do końca serii"
              selected={scope === "this_and_future"}
              onSelect={() => setScope("this_and_future")}
            />
            <ScopeOptionCard
              title="Całą serię"
              subtitle="Wszystkie przyszłe, przeszłe nietknięte"
              selected={scope === "whole_series"}
              onSelect={() => setScope("whole_series")}
            />
          </div>
          <Button className="w-full" onClick={() => setStep("form")} disabled={!sessionDetail}>
            Dalej →
          </Button>
        </div>
      )}

      {step === "form" && sessionDetail && (
        <div className="space-y-4">
          <ScheduleRecurrenceForm
            templateTitle={sessionDetail.template_title}
            templateSubtitle={
              new Date(sessionDetail.calendar_date + "T00:00:00").toLocaleDateString("pl-PL", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }) +
              " · " +
              sessionDetail.studio_name
            }
            studios={[]}
            studioId={sessionDetail.studio_id ?? ""}
            onStudioChange={() => {}}
            rooms={rooms}
            roomId={roomId}
            onRoomChange={setRoomId}
            instructors={instructors}
            instructorId={instructorId}
            onInstructorChange={setInstructorId}
            capacity={capacity}
            onCapacityChange={setCapacity}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            selectedDays={selectedDays}
            onToggleDay={toggleDay}
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            disableFromDate={scope !== "this_and_future"}
            toDate={toDate}
            onToDateChange={setToDate}
            startTime={startTime}
            onStartTimeChange={setStartTime}
          />
          <div className="flex gap-3 pt-4">
            {sessionDetail.is_recurring && (
              <Button variant="outline" onClick={() => setStep("scope")}>
                <ArrowLeft size={14} className="mr-1" />
                Wstecz
              </Button>
            )}
            <Button className="flex-1" onClick={goToPreview} disabled={isLoadingPreview}>
              {isLoadingPreview ? "Generowanie..." : "Podgląd →"}
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && previewResponse && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Zmiany w {previewResponse.total_affected}{" "}
            {previewResponse.total_affected === 1 ? "sesji" : "sesjach"}
          </h2>

          <SessionChangesPreview
            items={previewResponse.items}
            notificationSummary={previewResponse.notification_summary}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("form")}>
              Wstecz
            </Button>
            <Button className="flex-1" onClick={handleCommit} disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz i powiadom"}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && commitResult && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-brand-green-700">
            <Check size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Zapisano zmiany</h2>
            <p className="text-sm text-gray-500">
              {(() => {
                const total =
                  commitResult.updated.length +
                  commitResult.created.length +
                  commitResult.cancelled.length;
                return `Zaktualizowano ${total} ${sesjeAccusative(total)}.`;
              })()}{" "}
              Powiadomienia trafiły do kolejki wysyłki.
            </p>
          </div>
          <div className="w-full rounded-xl border bg-white px-4 py-3.5 text-left">
            <p className="text-sm font-medium text-gray-900">
              {[
                commitResult.updated.length > 0
                  ? `${commitResult.updated.length} ${zmienionaForm(commitResult.updated.length)}`
                  : null,
                commitResult.created.length > 0
                  ? `${commitResult.created.length} ${nowaForm(commitResult.created.length)}`
                  : null,
                commitResult.cancelled.length > 0
                  ? `${commitResult.cancelled.length} ${odwolanaForm(commitResult.cancelled.length)}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Brak zmian"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">Grafik odzwierciedla zmiany od razu.</p>
          </div>
          <Button className="w-full" onClick={() => router.push("/konto/partner/grafik")}>
            Wróć do grafiku
          </Button>
        </div>
      )}
    </div>
  );
}

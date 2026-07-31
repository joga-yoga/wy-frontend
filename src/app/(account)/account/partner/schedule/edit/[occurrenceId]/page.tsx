"use client";

import { ArrowLeft, Info } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { SessionContextCard } from "@/components/b2b/SessionContextCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";
import { isFewForm, plural } from "@/lib/polishPlural";

import { ScheduleRecurrenceForm } from "../../../class-schedules/components/ScheduleRecurrenceForm";
import type { RoomOption } from "../../../class-schedules/types";
import { InstructorPicker } from "../../components/InstructorPicker";
import { ScheduleSuccessScreen } from "../../components/ScheduleSuccessScreen";
import { ScopeOptionCard } from "../../components/ScopeOptionCard";
import { PreviewNoteCard, SessionChangesPreview } from "../../components/SessionChangesPreview";
import type {
  SessionDetailResponse,
  SessionEditCommitResponse,
  SessionEditPreviewResponse,
} from "../../types";

type Scope = "single" | "this_and_future" | "whole_series";

/** How the chosen scope is described back to the user, kept identical across every step. */
function scopeLabel(scope: Scope, isSubstitution: boolean): string {
  if (scope === "single") return isSubstitution ? "tylko ta sesja (zastępstwo)" : "tylko ta sesja";
  if (scope === "this_and_future") return "ta i kolejne";
  return "cała seria";
}

function formatStartTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}
type Step = "scope" | "form" | "preview" | "success";

const WEEKDAY_KEYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

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

/** "ZMIANA W 1 SESJI" / "ZMIANY W 21 SESJACH · OD 20 LIPCA" / "CAŁA SERIA · 34 PRZYSZŁE SESJE" */
function previewScopeLabel(scope: Scope, total: number, cutoffDate: string): string {
  if (scope === "single") return "ZMIANA W 1 SESJI";
  if (scope === "whole_series") {
    return `CAŁA SERIA · ${total} ${plural(total, "PRZYSZŁA SESJA", "PRZYSZŁE SESJE", "PRZYSZŁYCH SESJI")}`;
  }
  const from = new Date(cutoffDate + "T00:00:00").toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
  });
  // "ZMIANA w 1 sesji" but "ZMIANY w 21 sesjach" — the noun agrees too, not just the count.
  const head = total === 1 ? "ZMIANA W 1 SESJI" : `ZMIANY W ${total} SESJACH`;
  return `${head} · OD ${from}`;
}

/** What this scope promises *not* to touch — the reassurance S5/S7 make explicit. */
function scopeAssurance(scope: Scope): string {
  if (scope === "single") {
    return "Zmiana dotyczy tylko tej sesji — reszta serii bez zmian. Sesja zostanie oznaczona jako wyjątek.";
  }
  if (scope === "this_and_future") {
    return "Wcześniejsze sesje pozostaną nietknięte. Ręcznie zmienione sesje nie są nadpisywane.";
  }
  return "Przeszłe sesje pozostaną nietknięte. Ręcznie zmienione sesje nie są nadpisywane.";
}

function usunietaForm(n: number): string {
  if (n === 1) return "usunięta";
  return isFewForm(n) ? "usunięte" : "usuniętych";
}

// `deleted` counts too: a series edit that drops a weekday deletes its empty occurrences, and
// omitting them understated what the save actually did.
function committedTotal(r: SessionEditCommitResponse): number {
  return r.updated.length + r.created.length + r.cancelled.length + r.deleted.length;
}

function commitSummary(r: SessionEditCommitResponse): string {
  return (
    [
      r.updated.length > 0 ? `${r.updated.length} ${zmienionaForm(r.updated.length)}` : null,
      r.created.length > 0 ? `${r.created.length} ${nowaForm(r.created.length)}` : null,
      r.cancelled.length > 0 ? `${r.cancelled.length} ${odwolanaForm(r.cancelled.length)}` : null,
      r.deleted.length > 0 ? `${r.deleted.length} ${usunietaForm(r.deleted.length)}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Brak zmian"
  );
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
      {step === "scope" && sessionDetail && (
        <div className="space-y-4">
          <SessionContextCard
            title={sessionDetail.template_title}
            subtitle={`${shortDate(sessionDetail.calendar_date)} · ${formatStartTime(sessionDetail.start_time)}${sessionDetail.instructor_name ? ` · ${sessionDetail.instructor_name}` : ""}`}
          />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {isSubstitution ? "Na ile zajęć?" : "Czego dotyczy zmiana?"}
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
          <Button size="action" variant="green" className="w-full" onClick={() => setStep("form")}>
            Dalej
          </Button>
        </div>
      )}

      {step === "form" && sessionDetail && isSubstitution && (
        <div className="space-y-4">
          <SessionContextCard
            title={sessionDetail.template_title}
            subtitle={`Zakres: ${scopeLabel(scope, isSubstitution)} · ${shortDate(sessionDetail.calendar_date)}`}
          />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Prowadzący
          </p>
          <InstructorPicker
            instructors={instructors}
            selectedId={instructorId}
            currentId={sessionDetail.instructor_id}
            onSelect={setInstructorId}
          />
          <div className="flex gap-3 pt-2">
            {sessionDetail.is_recurring && (
              <Button variant="outline" onClick={() => setStep("scope")}>
                <ArrowLeft size={14} className="mr-1" />
                Wstecz
              </Button>
            )}
            <Button
              size="action"
              variant="green"
              className="flex-1"
              onClick={goToPreview}
              disabled={isLoadingPreview}
            >
              {isLoadingPreview ? "Generowanie..." : "Zobacz podgląd zmian"}
            </Button>
          </div>
        </div>
      )}

      {step === "form" && sessionDetail && !isSubstitution && (
        <div className="space-y-4">
          <ScheduleRecurrenceForm
            templateTitle={sessionDetail.template_title}
            templateSubtitle={`Zakres: ${scopeLabel(scope, isSubstitution)} · ${shortDate(sessionDetail.calendar_date)}`}
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
            // One session has no recurrence to speak of (S3).
            showRecurrence={scope !== "single"}
          />
          <div className="flex gap-3 pt-4">
            {sessionDetail.is_recurring && (
              <Button variant="outline" onClick={() => setStep("scope")}>
                <ArrowLeft size={14} className="mr-1" />
                Wstecz
              </Button>
            )}
            <Button
              size="action"
              variant="green"
              className="flex-1"
              onClick={goToPreview}
              disabled={isLoadingPreview}
            >
              {isLoadingPreview ? "Generowanie..." : "Zobacz podgląd zmian"}
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && previewResponse && sessionDetail && (
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {previewScopeLabel(scope, previewResponse.total_affected, sessionDetail.calendar_date)}
          </p>

          <SessionChangesPreview
            items={previewResponse.items}
            notificationSummary={previewResponse.notification_summary}
          />

          {/* The scope's guarantee, stated rather than implied (S5/S7). */}
          <PreviewNoteCard icon={<Info size={15} />}>{scopeAssurance(scope)}</PreviewNoteCard>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("form")}>
              Wstecz
            </Button>
            <Button
              size="action"
              variant="green"
              className="flex-1"
              onClick={handleCommit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && commitResult && (
        <ScheduleSuccessScreen
          headline="Zapisano zmiany"
          body={`Zaktualizowano ${sesjeAccusative(committedTotal(commitResult))}. Powiadomienia trafiły do kolejki wysyłki.`}
          summary={commitSummary(commitResult)}
        />
      )}
    </div>
  );
}

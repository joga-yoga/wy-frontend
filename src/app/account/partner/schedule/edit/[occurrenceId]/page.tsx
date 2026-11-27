"use client";

import { isAxiosError } from "axios";
import { ArrowLeft, Info, Plus } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { StudioRosterAddForm } from "@/app/account/partner/instructors/components/StudioRosterAddForm";
import { SessionContextCard } from "@/components/b2b/SessionContextCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAssignableInstructorSource } from "@/hooks/useAssignableInstructors";
import { useScheduleRooms } from "@/hooks/useScheduleRooms";
import { axiosInstance } from "@/lib/axiosInstance";
import { addCalendarMonthClamped, formatDateYMD } from "@/lib/formatDateRange";
import { isFewForm, plural } from "@/lib/polishPlural";
import { isValidTime } from "@/lib/timeInput";

import {
  type EndDateMode,
  ScheduleRecurrenceForm,
} from "../../../class-schedules/components/ScheduleRecurrenceForm";
import { ScheduleRoomField } from "../../../class-schedules/components/ScheduleRoomField";
import { InstructorPicker } from "../../components/InstructorPicker";
import { ScheduleSuccessScreen } from "../../components/ScheduleSuccessScreen";
import { ScopeOptionCard } from "../../components/ScopeOptionCard";
import { PreviewNoteCard, SessionChangesPreview } from "../../components/SessionChangesPreview";
import { noticeQueueCopy } from "../../noticeQueueCopy";
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

function sessionDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function shortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}
type Step = "scope" | "form" | "preview" | "success";

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

  const [step, setStep] = useState<Step>("scope");
  const [scope, setScope] = useState<Scope>("single");

  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const isSolo = sessionDetail?.organizer_kind === "solo";
  const isSubstitution = searchParams.get("field") === "instructor" && !isSolo;
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  const [startTime, setStartTime] = useState("");
  const timeValid = isSubstitution || isValidTime(startTime);
  const [roomId, setRoomId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [instructorId, setInstructorId] = useState("");

  const studioId = isSolo ? null : (sessionDetail?.studio_id ?? null);
  const {
    instructors: assignable,
    loading: instructorsLoading,
    error: instructorsError,
    refresh: refreshInstructors,
  } = useAssignableInstructorSource(studioId);
  const [isInstructorOpen, setIsInstructorOpen] = useState(false);
  const [instructorStep, setInstructorStep] = useState<"identify" | "new">("identify");
  const [addedInstructorId, setAddedInstructorId] = useState<string | null>(null);
  const addInstructorRef = useRef<HTMLButtonElement>(null);
  const showInstructorNotice =
    addedInstructorId &&
    !instructorsLoading &&
    (instructorsError || !assignable.some((row) => row.id === addedInstructorId));
  const currentInstructorId =
    scope !== "single" && sessionDetail?.series_instructor_id !== undefined
      ? sessionDetail.series_instructor_id
      : (sessionDetail?.instructor_id ?? null);
  const currentInstructorName =
    scope !== "single" && sessionDetail?.series_instructor_name !== undefined
      ? sessionDetail.series_instructor_name
      : sessionDetail?.instructor_name;
  const currentRoomId =
    scope !== "single" && sessionDetail?.series_room_id !== undefined
      ? sessionDetail.series_room_id
      : sessionDetail?.room_id;
  const instructors =
    currentInstructorId &&
    currentInstructorName &&
    !assignable.some((row) => row.id === currentInstructorId)
      ? [{ id: currentInstructorId, name: currentInstructorName }, ...assignable]
      : assignable;
  const roomState = useScheduleRooms(sessionDetail?.studio_id, roomId, setRoomId, isSolo);
  const instructorChanged = instructorId !== (currentInstructorId ?? "");
  const roomChanged = roomId !== (currentRoomId ?? "");
  const canPreview =
    roomState.roomValid &&
    timeValid &&
    (!isSubstitution || (!!instructorId && (instructorChanged || roomChanged)));

  // Recurrence form state
  const [frequency, setFrequency] = useState<"once" | "weekly">("weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [endDateMode, setEndDateMode] = useState<EndDateMode>("endless");

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

        // `fromDate` is derived separately below (it depends on `scope`, which isn't chosen
        // yet at this point — the scope step comes first).

        // Pre-fill the real series pattern — not the tapped occurrence's single
        // day-of-week, which silently collapsed a Mon/Wed/Fri series to whichever day
        // happened to be tapped on any "this and following"/"whole series" save.
        // `frequency` local state stays "weekly" (its default): `recurrence_frequency`
        // can only ever be "WEEKLY" or null for a recurring series today (see
        // `parse_recurrence`'s docstring — no other FREQ is generated or understood).
        setSelectedDays(sd.recurrence_days ?? []);

        // Pre-fill series end date from UNTIL, and derive which end-date mode that implies —
        // without this, an endless series (no UNTIL) hydrated `toDate` to `undefined` and the
        // old single-Calendar UI showed an empty, unselected "Wybierz datę" placeholder, reading
        // as broken rather than intentionally endless.
        if (sd.series_to_date) {
          setToDate(new Date(sd.series_to_date + "T00:00:00"));
          setEndDateMode("custom");
        } else {
          setEndDateMode("endless");
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

  // The (disabled, display-only) start date depends on scope: "this and following" starts
  // from the tapped occurrence, but "whole series" starts from the series' actual first
  // upcoming occurrence — which is not necessarily the one the caller tapped into if they
  // opened the edit screen from a mid-series session. Re-derives whenever `scope` changes
  // rather than only once at hydration, since the scope step is chosen after this data loads.
  useEffect(() => {
    if (!sessionDetail) return;
    const dateStr =
      scope === "whole_series"
        ? (sessionDetail.series_from_date ?? sessionDetail.calendar_date)
        : sessionDetail.calendar_date;
    setFromDate(new Date(dateStr + "T00:00:00"));
  }, [scope, sessionDetail]);

  const selectScope = (next: Scope) => {
    if ((scope === "single") !== (next === "single")) {
      const effectiveInstructor =
        next === "single" || sessionDetail?.series_instructor_id === undefined
          ? sessionDetail?.instructor_id
          : sessionDetail.series_instructor_id;
      const effectiveRoom =
        next === "single" || sessionDetail?.series_room_id === undefined
          ? sessionDetail?.room_id
          : sessionDetail.series_room_id;
      setInstructorId(effectiveInstructor ?? "");
      setRoomId(effectiveRoom ?? "");
    }
    setScope(next);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const buildPayload = () => {
    if (isSubstitution) {
      return {
        occurrence_id: params.occurrenceId,
        scope,
        instructor_id: instructorId,
        ...(roomChanged ? { room_id: roomId || null } : {}),
      };
    }

    const payload: Record<string, unknown> = {
      occurrence_id: params.occurrenceId,
      scope,
      // Always send field values; null = explicitly clear
      room_id: roomId || null,
      capacity: capacity ? parseInt(capacity, 10) : null,
      ...(!isSolo && instructorChanged ? { instructor_id: instructorId || null } : {}),
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
      // `to_date` follows the request schema's omit-vs-null contract: omitting the key keeps
      // whatever the series already has, so "Bezterminowo" must send an explicit `null` to
      // actually clear an existing end date, not just skip the field.
      if (endDateMode === "endless") {
        payload.to_date = null;
      } else if (endDateMode === "1month") {
        if (fromDate) {
          payload.to_date = formatDateYMD(addCalendarMonthClamped(fromDate));
        }
      } else if (toDate) {
        payload.to_date = formatDateYMD(toDate);
      }
    }

    return payload;
  };

  const goToPreview = async () => {
    if (!canPreview) return;
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
    if (!canPreview) {
      setStep("form");
      return;
    }
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
    } catch (error: unknown) {
      const detail: unknown = isAxiosError(error) ? error.response?.data?.detail : null;
      toast({
        description: typeof detail === "string" ? detail : "Nie udało się zapisać zmian.",
        variant: "destructive",
      });
      if (isAxiosError(error) && error.response?.status === 400) {
        roomState.retryRooms();
        setStep("form");
      }
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
            date={shortDate(sessionDetail.calendar_date)}
            time={formatStartTime(sessionDetail.start_time)}
            durationMinutes={sessionDurationMinutes(
              sessionDetail.start_time,
              sessionDetail.end_time,
            )}
            color={sessionDetail.color}
            instructor={
              sessionDetail.instructor_name
                ? { id: sessionDetail.instructor_id, name: sessionDetail.instructor_name }
                : null
            }
          />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {isSubstitution ? "Na ile zajęć?" : "Czego dotyczy zmiana?"}
          </p>
          <div className="space-y-2">
            <ScopeOptionCard
              title="Tylko tę sesję"
              subtitle={isSubstitution ? "Jednorazowe zastępstwo" : "Wyjątek, seria bez zmian"}
              selected={scope === "single"}
              onSelect={() => selectScope("single")}
            />
            <ScopeOptionCard
              title="Tę i kolejne"
              subtitle="Od tej daty do końca serii"
              selected={scope === "this_and_future"}
              onSelect={() => selectScope("this_and_future")}
            />
            <ScopeOptionCard
              title="Całą serię"
              subtitle="Wszystkie przyszłe, przeszłe nietknięte"
              selected={scope === "whole_series"}
              onSelect={() => selectScope("whole_series")}
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
            date={shortDate(sessionDetail.calendar_date)}
            time={formatStartTime(sessionDetail.start_time)}
            durationMinutes={sessionDurationMinutes(
              sessionDetail.start_time,
              sessionDetail.end_time,
            )}
            color={sessionDetail.color}
            subtitle={`Zakres: ${scopeLabel(scope, isSubstitution)}`}
          />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Prowadzący
          </p>
          <InstructorPicker
            instructors={instructors}
            selectedId={instructorId}
            currentId={currentInstructorId}
            otherLabel={scope === "single" ? "Zastępstwo" : ""}
            emptyHint="Brak instruktorów dostępnych w tym studiu."
            onSelect={setInstructorId}
          />
          {studioId && (
            <>
              <button
                ref={addInstructorRef}
                type="button"
                className="flex w-full items-center gap-3 rounded-b2b border border-gray-200 bg-white px-2 py-3 text-left text-sm font-semibold text-gray-800 shadow-xs transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => {
                  setInstructorStep("identify");
                  setIsInstructorOpen(true);
                }}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center"
                  aria-hidden="true"
                >
                  <Plus className="size-5" />
                </span>
                Dodaj instruktora
              </button>
              <Dialog open={isInstructorOpen} onOpenChange={setIsInstructorOpen}>
                <DialogContent
                  finalFocus={addInstructorRef}
                  closeLabel="Zamknij"
                  className="max-h-[90dvh] overflow-y-auto"
                >
                  <DialogTitle>Dodaj instruktora</DialogTitle>
                  <StudioRosterAddForm
                    studioId={studioId}
                    step={instructorStep}
                    onNew={() => setInstructorStep("new")}
                    onAdded={(id) => {
                      setIsInstructorOpen(false);
                      setAddedInstructorId(id);
                      void refreshInstructors();
                    }}
                  />
                </DialogContent>
              </Dialog>
              {showInstructorNotice && (
                <div>
                  <p className="text-sm text-gray-500" role="status">
                    {instructorsError
                      ? "Instruktor dodany. Nie udało się odświeżyć listy."
                      : "Instruktor nie jest jeszcze dostępny do przypisania."}
                  </p>
                  {instructorsError && (
                    <Button variant="outline" size="sm" onClick={() => void refreshInstructors()}>
                      Odśwież listę instruktorów
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
          <ScheduleRoomField {...roomState} roomId={roomId} onRoomChange={setRoomId} />
          <div className="flex gap-3 pt-2">
            {sessionDetail.is_recurring && (
              <Button size="action" variant="outline" onClick={() => setStep("scope")}>
                <ArrowLeft size={14} className="mr-1" />
                Wstecz
              </Button>
            )}
            <Button
              size="action"
              variant="green"
              className="flex-1"
              onClick={goToPreview}
              disabled={isLoadingPreview || !canPreview}
            >
              {isLoadingPreview ? "Generowanie..." : "Zobacz podgląd zmian"}
            </Button>
          </div>
        </div>
      )}

      {step === "form" && sessionDetail && !isSubstitution && (
        <div className="space-y-4">
          <ScheduleRecurrenceForm
            solo={isSolo}
            templateTitle={sessionDetail.template_title}
            templateDate={shortDate(sessionDetail.calendar_date)}
            templateTime={formatStartTime(sessionDetail.start_time)}
            templateDurationMinutes={sessionDurationMinutes(
              sessionDetail.start_time,
              sessionDetail.end_time,
            )}
            templateColor={sessionDetail.color}
            templateSubtitle={`Zakres: ${scopeLabel(scope, isSubstitution)}`}
            templateInstructor={
              sessionDetail.instructor_name
                ? { id: sessionDetail.instructor_id, name: sessionDetail.instructor_name }
                : null
            }
            {...roomState}
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
            disableFromDate
            toDate={toDate}
            onToDateChange={setToDate}
            endDateMode={endDateMode}
            onEndDateModeChange={setEndDateMode}
            startTime={startTime}
            onStartTimeChange={setStartTime}
            // One session has no recurrence to speak of (S3).
            showRecurrence={scope !== "single"}
          />
          <div className="flex gap-3 pt-4">
            {sessionDetail.is_recurring && (
              <Button size="action" variant="outline" onClick={() => setStep("scope")}>
                <ArrowLeft size={14} className="mr-1" />
                Wstecz
              </Button>
            )}
            <Button
              size="action"
              variant="green"
              className="flex-1"
              onClick={goToPreview}
              disabled={isLoadingPreview || !roomState.roomValid || !timeValid}
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
            <Button size="action" variant="outline" onClick={() => setStep("form")}>
              Wstecz
            </Button>
            <Button
              size="action"
              variant="green"
              className="flex-1"
              onClick={handleCommit}
              disabled={isSubmitting || !roomState.roomValid}
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && commitResult && (
        <ScheduleSuccessScreen
          headline="Zapisano zmiany"
          body={`Zaktualizowano ${sesjeAccusative(committedTotal(commitResult))}. ${noticeQueueCopy(commitResult.expected_recipients, commitResult.queued_recipients)}`}
          summary={commitSummary(commitResult)}
        />
      )}
    </div>
  );
}

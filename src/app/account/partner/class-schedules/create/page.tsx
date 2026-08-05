"use client";

import { ArrowLeft, Check, ChevronRight, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { COLOR_SWATCH_MAP } from "@/lib/classColors";
import { cn } from "@/lib/utils";

import { TemplateEditor } from "../../class-templates/components/TemplateEditor";
import type { ClassTemplate, ClassTemplateCreate } from "../../class-templates/types";
import type { PickableInstructor } from "../../schedule/components/InstructorPicker";
import { type EndDateMode, ScheduleRecurrenceForm } from "../components/ScheduleRecurrenceForm";
import type {
  PreviewOccurrence,
  RoomOption,
  ScheduleCreatePayload,
  SchedulePreviewResponse,
  StudioOption,
} from "../types";

/** "1 Month" as a calendar-month rollover, clamped at month end (e.g. Jan 31 → Feb 28/29)
 * rather than JS's native date-overflow behavior (which would roll Jan 31 + 1 month into
 * March). */
function addCalendarMonthClamped(d: Date): Date {
  const year = d.getFullYear();
  const month = d.getMonth();
  const targetMonth = month + 1;
  const daysInTargetMonth = new Date(year, targetMonth + 1, 0).getDate();
  return new Date(year, targetMonth, Math.min(d.getDate(), daysInTargetMonth));
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDatePL(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

type Step = "select" | "recurrence" | "preview" | "success";

// `level` is stored as an English enum ("advanced"). Rendering it raw leaked
// "60 min · advanced" into a Polish UI.
const LEVEL_LABELS: Record<string, string> = {
  beginner: "początkujący",
  intermediate: "średni",
  advanced: "zaawansowany",
  all_levels: "wszystkie poziomy",
};

function levelLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level;
}

export default function CreateScheduleWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("select");
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ClassTemplate | null>(null);
  const [search, setSearch] = useState("");
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // Step 2
  const [studios, setStudios] = useState<StudioOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [studioId, setStudioId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [instructors, setInstructors] = useState<PickableInstructor[]>([]);
  const [frequency, setFrequency] = useState<"once" | "weekly">("weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>(["MO"]);
  const [fromDate, setFromDate] = useState<Date | undefined>(() => new Date());
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [endDateMode, setEndDateMode] = useState<EndDateMode>("custom");
  const [startTime, setStartTime] = useState("09:00");

  // Step 3
  const [previewOccs, setPreviewOccs] = useState<PreviewOccurrence[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Success
  const [totalCreated, setTotalCreated] = useState(0);
  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    axiosInstance
      .get<ClassTemplate[]>("/class-templates")
      .then((r) => setTemplates(r.data ?? []))
      .catch(() => {});
    axiosInstance
      .get<StudioOption[]>("/studios")
      .then((r) => {
        setStudios(r.data ?? []);
        if (r.data?.length === 1) setStudioId(r.data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!studioId) {
      setRooms([]);
      return;
    }
    axiosInstance
      .get<RoomOption[]>(`/studios/${studioId}/rooms`)
      .then((r) => setRooms(r.data ?? []))
      .catch(() => setRooms([]));
  }, [studioId]);

  // Roster (not the flat `/instructors` list) — carries `image_id`/`row_state` for
  // the avatar picker, and matches the edit flow's Zastępstwo picker data source.
  useEffect(() => {
    if (!studioId) {
      setInstructors([]);
      return;
    }
    axiosInstance
      .get<{ items: PickableInstructor[] }>(`/studios/${studioId}/roster`)
      .then((r) =>
        setInstructors(
          r.data.items.map(({ id, name, image_id, row_state }) => ({
            id,
            name,
            image_id,
            row_state,
          })),
        ),
      )
      .catch(() => setInstructors([]));
  }, [studioId]);

  useEffect(() => {
    if (selectedTemplate) {
      if (selectedTemplate.default_instructor_id)
        setInstructorId(selectedTemplate.default_instructor_id);
      if (selectedTemplate.default_capacity != null)
        setCapacity(String(selectedTemplate.default_capacity));
    }
  }, [selectedTemplate]);

  // "Dodaj do grafiku" from a template's own screen arrives with ?templateId= and should
  // skip step 1 — the user has already chosen, and asking again is the thing that link
  // exists to avoid.
  //
  // This deliberately keys on `templates`, not on mount: the list loads asynchronously,
  // so a mount-time read finds it empty and silently falls through to step 1. The ref
  // makes it fire once, so pressing Back from step 2 returns to the picker instead of
  // being bounced straight forward again.
  const preselectAppliedRef = useRef(false);
  useEffect(() => {
    if (preselectAppliedRef.current) return;
    const wanted = searchParams.get("templateId");
    if (!wanted || templates.length === 0) return;
    const match = templates.find((t) => t.id === wanted);
    if (!match) return;
    preselectAppliedRef.current = true;
    setSelectedTemplate(match);
    setStep("recurrence");
  }, [templates, searchParams]);

  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.title.toLowerCase().includes(search.toLowerCase())),
    [templates, search],
  );

  const handleCreateTemplate = async (data: ClassTemplateCreate) => {
    setIsCreatingTemplate(true);
    try {
      const r = await axiosInstance.post<ClassTemplate>("/class-templates", data);
      const created = r.data;
      setTemplates((prev) => [created, ...prev]);
      setSelectedTemplate(created);
      setShowInlineCreate(false);
      setStep("recurrence");
      toast({ description: "Szablon utworzony i wybrany." });
    } catch {
      toast({ description: "Nie udało się utworzyć szablonu.", variant: "destructive" });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const buildPayload = useCallback((): ScheduleCreatePayload | null => {
    if (!selectedTemplate || !studioId || !fromDate) return null;

    let effectiveToDate: Date | undefined;
    if (frequency === "once") {
      effectiveToDate = fromDate;
    } else if (endDateMode === "endless") {
      effectiveToDate = undefined;
    } else if (endDateMode === "1month") {
      effectiveToDate = addCalendarMonthClamped(fromDate);
    } else {
      if (!toDate) return null;
      effectiveToDate = toDate;
    }

    return {
      template_id: selectedTemplate.id,
      studio_id: studioId,
      room_id: roomId || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      instructor_ids: instructorId ? [instructorId] : undefined,
      frequency,
      days: frequency === "weekly" ? selectedDays : undefined,
      from_date: formatDate(fromDate),
      to_date: effectiveToDate ? formatDate(effectiveToDate) : undefined,
      start_time: startTime + ":00",
    };
  }, [
    selectedTemplate,
    studioId,
    roomId,
    capacity,
    instructorId,
    frequency,
    selectedDays,
    fromDate,
    endDateMode,
    toDate,
    startTime,
  ]);

  const goToPreview = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setIsLoadingPreview(true);
    try {
      const r = await axiosInstance.post<SchedulePreviewResponse>(
        "/class-schedules/preview",
        payload,
      );
      setPreviewOccs(r.data.occurrences);
      setPreviewTotal(r.data.total);
      setStep("preview");
    } catch {
      toast({ description: "Nie udało się wygenerować podglądu.", variant: "destructive" });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const commit = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setIsCommitting(true);
    try {
      const r = await axiosInstance.post("/class-schedules", payload);
      setTotalCreated(r.data.total_created);
      setStep("success");
    } catch {
      toast({ description: "Nie udało się utworzyć grafiku.", variant: "destructive" });
    } finally {
      setIsCommitting(false);
    }
  };

  const stepNumber = step === "select" ? 1 : step === "recurrence" ? 2 : step === "preview" ? 3 : 3;

  const canAdvanceStep2 =
    studioId &&
    fromDate &&
    (frequency === "once" || (selectedDays.length > 0 && (endDateMode !== "custom" || toDate)));

  return (
    <div className="p-4 mx-auto max-w-lg min-h-screen">
      {/* Progress bar */}
      {step !== "success" && (
        <p className="text-xs text-gray-500 mb-2">
          Krok {stepNumber} z 3 ·{" "}
          {step === "select"
            ? "Wybierz zajęcia"
            : step === "recurrence"
              ? "Ustaw powtarzanie"
              : "Podgląd"}
        </p>
      )}
      {step !== "success" && (
        <div className="flex gap-1 mb-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${n <= stepNumber ? "bg-gray-900" : "bg-gray-200"}`}
            />
          ))}
        </div>
      )}

      {/* Step 1: Select template or create inline */}
      {step === "select" && !showInlineCreate && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj szablonu…"
              className="h-11 rounded-full border-gray-200 bg-gray-50 pl-10"
            />
          </div>

          {filteredTemplates.length === 0 && !search ? (
            <div className="rounded-b2b border border-dashed bg-gray-50 py-8 px-4 text-center space-y-3">
              <p className="text-sm font-semibold text-gray-900">Najpierw utwórz szablon zajęć</p>
              <p className="text-xs text-gray-500">
                {`Szablon to definicja zajęć (np. „Vinyasa Flow", 60 min).`}
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowInlineCreate(true)}>
                <Plus size={14} className="mr-1" />
                Utwórz szablon
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Same single-container catalogue as U1, so the picker and the catalogue
                  read as the same list rather than two views of it. */}
              <div className="divide-y overflow-hidden rounded-b2b border bg-white">
                {filteredTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t);
                      setStep("recurrence");
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selectedTemplate?.id === t.id ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        t.color ? COLOR_SWATCH_MAP[t.color] : "bg-gray-200",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{t.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {t.duration_minutes} min{t.level ? ` · ${levelLabel(t.level)}` : ""}
                        {t.default_capacity ? ` · limit ${t.default_capacity}` : ""}
                      </p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-gray-300" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs text-gray-400">albo</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              <Button
                size="action"
                variant="outline"
                className="w-full"
                onClick={() => setShowInlineCreate(true)}
              >
                <Plus size={15} className="mr-1.5" />
                Nowy szablon zajęć
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 1 sub-step: Inline template creation */}
      {step === "select" && showInlineCreate && (
        <div className="space-y-4">
          <button
            onClick={() => setShowInlineCreate(false)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={14} />
            Wróć do listy
          </button>
          <h2 className="text-lg font-semibold">Nowy szablon zajęć</h2>
          <TemplateEditor
            onSubmit={handleCreateTemplate}
            submitLabel="Zapisz i wybierz"
            isSubmitting={isCreatingTemplate}
          />
        </div>
      )}

      {/* Step 2: Recurrence */}
      {step === "recurrence" && selectedTemplate && (
        <div className="space-y-5">
          <ScheduleRecurrenceForm
            templateTitle={selectedTemplate.title}
            templateSubtitle={`${selectedTemplate.duration_minutes} min${
              selectedTemplate.level ? ` · ${levelLabel(selectedTemplate.level)}` : ""
            }`}
            onChangeTemplate={() => setStep("select")}
            studios={studios}
            studioId={studioId}
            onStudioChange={setStudioId}
            rooms={rooms}
            roomId={roomId}
            onRoomChange={setRoomId}
            instructors={instructors}
            instructorId={instructorId}
            onInstructorChange={setInstructorId}
            defaultInstructorId={selectedTemplate.default_instructor_id}
            capacity={capacity}
            onCapacityChange={setCapacity}
            defaultCapacity={selectedTemplate.default_capacity}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            selectedDays={selectedDays}
            onToggleDay={toggleDay}
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
            endDateMode={endDateMode}
            onEndDateModeChange={setEndDateMode}
            startTime={startTime}
            onStartTimeChange={setStartTime}
          />
          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button size="action" variant="outline" onClick={() => setStep("select")}>
              <ArrowLeft size={14} className="mr-1" />
              Wstecz
            </Button>
            <Button
              size="action"
              className="flex-1"
              onClick={goToPreview}
              disabled={!canAdvanceStep2 || isLoadingPreview}
            >
              {isLoadingPreview ? "Generowanie..." : "Podgląd →"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Powstanie {previewTotal} {previewTotal === 1 ? "sesja" : "sesji"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {selectedTemplate?.title} · {selectedTemplate?.duration_minutes} min
            </p>
          </div>

          <div className="space-y-2">
            {previewOccs.slice(0, 4).map((occ, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-b2b border bg-white"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDatePL(occ.calendar_date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {occ.start_time.match(/T(\d{2}:\d{2})/)?.[1] ?? occ.start_time}
                    {" – "}
                    {occ.end_time.match(/T(\d{2}:\d{2})/)?.[1] ?? occ.end_time}
                  </p>
                </div>
              </div>
            ))}
            {previewTotal > 4 && (
              <p className="text-xs text-gray-500 text-center py-2">
                + {previewTotal - 4} kolejnych sesji
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button size="action" variant="outline" onClick={() => setStep("recurrence")}>
              <ArrowLeft size={14} className="mr-1" />
              Wstecz
            </Button>
            <Button size="action" className="flex-1" onClick={commit} disabled={isCommitting}>
              {isCommitting ? "Tworzenie..." : "Utwórz grafik"}
            </Button>
          </div>
        </div>
      )}

      {/* Success */}
      {step === "success" && (
        <div className="text-center py-12 space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-semibold">Grafik utworzony</h2>
          <p className="text-sm text-gray-500">
            Dodano {totalCreated} {totalCreated === 1 ? "sesję" : "sesji"}. Pojawiły się w grafiku
            tygodnia.
          </p>
          <div className="space-y-2 pt-4">
            <Button
              size="action"
              className="w-full"
              onClick={() => router.push("/account/partner/schedule")}
            >
              Zobacz grafik
            </Button>
            <Button
              size="action"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("select");
                setSelectedTemplate(null);
                setShowInlineCreate(false);
                setFromDate(new Date());
                setToDate(undefined);
                setEndDateMode("custom");
                setPreviewOccs([]);
              }}
            >
              <Plus size={14} className="mr-1" />
              Dodaj kolejne zajęcia
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

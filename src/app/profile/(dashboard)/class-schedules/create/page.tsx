"use client";

import { ArrowLeft, Check, ChevronRight, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { TemplateEditor } from "../../class-templates/components/TemplateEditor";
import type { ClassTemplate, ClassTemplateCreate } from "../../class-templates/types";
import type {
  PreviewOccurrence,
  RoomOption,
  ScheduleCreatePayload,
  SchedulePreviewResponse,
  StudioOption,
} from "../types";

const DAYS = [
  { key: "MO", label: "Pn" },
  { key: "TU", label: "Wt" },
  { key: "WE", label: "Śr" },
  { key: "TH", label: "Cz" },
  { key: "FR", label: "Pt" },
  { key: "SA", label: "So" },
  { key: "SU", label: "Nd" },
] as const;

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

export default function CreateScheduleWizard() {
  const router = useRouter();
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
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [frequency, setFrequency] = useState<"once" | "weekly">("weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>(["MO"]);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
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
    axiosInstance
      .get<{ id: string; name: string }[]>("/instructors")
      .then((r) => setInstructors(r.data ?? []))
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

  useEffect(() => {
    if (selectedTemplate) {
      if (selectedTemplate.default_instructor_id)
        setInstructorId(selectedTemplate.default_instructor_id);
      if (selectedTemplate.default_capacity != null)
        setCapacity(String(selectedTemplate.default_capacity));
    }
  }, [selectedTemplate]);

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
    const effectiveToDate = frequency === "once" ? fromDate : toDate;
    if (!effectiveToDate) return null;

    return {
      template_id: selectedTemplate.id,
      studio_id: studioId,
      room_id: roomId || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      instructor_ids: instructorId ? [instructorId] : undefined,
      frequency,
      days: frequency === "weekly" ? selectedDays : undefined,
      from_date: formatDate(fromDate),
      to_date: formatDate(effectiveToDate),
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
    studioId && fromDate && (frequency === "once" || (toDate && selectedDays.length > 0));

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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj szablonu…"
              className="pl-9"
            />
          </div>

          {filteredTemplates.length === 0 && !search ? (
            <div className="rounded-xl border border-dashed bg-gray-50 py-8 px-4 text-center space-y-3">
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
            <div className="space-y-2">
              {filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t);
                    setStep("recurrence");
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left transition-colors ${
                    selectedTemplate?.id === t.id
                      ? "border-gray-900 bg-gray-50"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.duration_minutes} min{t.level ? ` · ${t.level}` : ""}
                      {t.default_capacity ? ` · limit ${t.default_capacity}` : ""}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </button>
              ))}
              <button
                onClick={() => setShowInlineCreate(true)}
                className="w-full text-center py-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus size={14} className="inline mr-1" />
                Nowy szablon zajęć
              </button>
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
          {/* Pinned template */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-gray-50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{selectedTemplate.title}</p>
              <p className="text-xs text-gray-500">
                {selectedTemplate.duration_minutes} min
                {selectedTemplate.level ? ` · ${selectedTemplate.level}` : ""}
              </p>
            </div>
            <button onClick={() => setStep("select")} className="text-xs text-blue-600 font-medium">
              Zmień
            </button>
          </div>

          {/* Studio */}
          {studios.length > 1 && (
            <div>
              <Label>Studio</Label>
              <Select value={studioId} onValueChange={setStudioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz studio" />
                </SelectTrigger>
                <SelectContent>
                  {studios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Instructor */}
          <div>
            <Label>
              Prowadzący
              {selectedTemplate.default_instructor_id &&
                instructorId === selectedTemplate.default_instructor_id && (
                  <span className="text-xs text-gray-400 ml-1">· z szablonu</span>
                )}
            </Label>
            <div className="flex gap-1.5">
              <Select value={instructorId || undefined} onValueChange={setInstructorId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Wybierz prowadzącego" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {instructorId && (
                <button
                  type="button"
                  onClick={() => setInstructorId("")}
                  className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Room */}
          {rooms.length > 0 && (
            <div>
              <Label>Sala</Label>
              <div className="flex gap-1.5">
                <Select value={roomId || undefined} onValueChange={setRoomId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Wybierz salę" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roomId && (
                  <button
                    type="button"
                    onClick={() => setRoomId("")}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Capacity */}
          <div>
            <Label>
              Limit
              {selectedTemplate.default_capacity != null &&
                capacity === String(selectedTemplate.default_capacity) && (
                  <span className="text-xs text-gray-400 ml-1">· z szablonu</span>
                )}
            </Label>
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Bez limitu"
            />
          </div>

          {/* Frequency toggle */}
          <div>
            <Label>Częstotliwość</Label>
            <div className="flex gap-0 mt-1 rounded-lg border overflow-hidden">
              {(["once", "weekly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    frequency === f
                      ? "bg-white border border-gray-900 rounded-lg text-gray-900 -m-px z-10"
                      : "text-gray-500"
                  }`}
                >
                  {f === "once" ? "Raz" : "Co tydzień"}
                </button>
              ))}
            </div>
          </div>

          {/* Days (weekly only) */}
          {frequency === "weekly" && (
            <div>
              <Label>Dni</Label>
              <div className="flex gap-1.5 mt-1">
                {DAYS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => toggleDay(d.key)}
                    className={`w-10 h-10 rounded-full text-xs font-medium transition-colors ${
                      selectedDays.includes(d.key)
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date pickers */}
          <div className={frequency === "once" ? "" : "grid grid-cols-2 gap-3"}>
            <div>
              <Label>{frequency === "once" ? "Data" : "Od dnia"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    {fromDate ? fromDate.toLocaleDateString("pl-PL") : "Wybierz datę"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fromDate} onSelect={setFromDate} />
                </PopoverContent>
              </Popover>
            </div>
            {frequency === "weekly" && (
              <div>
                <Label>Do dnia</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      {toDate ? toDate.toLocaleDateString("pl-PL") : "Wybierz datę"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate} onSelect={setToDate} />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Time */}
          <div>
            <Label>Godzina</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep("select")}>
              <ArrowLeft size={14} className="mr-1" />
              Wstecz
            </Button>
            <Button
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
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-white"
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
            <Button variant="outline" onClick={() => setStep("recurrence")}>
              <ArrowLeft size={14} className="mr-1" />
              Wstecz
            </Button>
            <Button className="flex-1" onClick={commit} disabled={isCommitting}>
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
            <Button className="w-full" onClick={() => router.push("/profile")}>
              Zobacz grafik
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("select");
                setSelectedTemplate(null);
                setShowInlineCreate(false);
                setFromDate(undefined);
                setToDate(undefined);
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

"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { ScheduleRecurrenceForm } from "../../../class-schedules/components/ScheduleRecurrenceForm";
import type { RoomOption } from "../../../class-schedules/types";
import { ScopeOptionCard } from "../../components/ScopeOptionCard";
import { SessionChangesPreview } from "../../components/SessionChangesPreview";
import type {
  SessionDetailResponse,
  SessionEditPreviewItem,
  SessionEditPreviewResponse,
} from "../../types";

type Scope = "single" | "this_and_future" | "whole_series";
type Step = "scope" | "form" | "preview";

const WEEKDAY_KEYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

export default function EditSessionPage() {
  const params = useParams<{ occurrenceId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const isSubstitution = searchParams.get("field") === "instructor";

  const [step, setStep] = useState<Step>("scope");
  const [scope, setScope] = useState<Scope>("single");

  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  const [startTime, setStartTime] = useState("");
  const [roomId, setRoomId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [instructorId, setInstructorId] = useState("");

  // Snapshot of values at load time (for diff baseline)
  const [initialStartTime, setInitialStartTime] = useState("");
  const [initialRoomId, setInitialRoomId] = useState("");
  const [initialCapacity, setInitialCapacity] = useState("");
  const [initialInstructorId, setInitialInstructorId] = useState("");

  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);

  // Form-parity state (not sent to backend yet — UX only)
  const [frequency, setFrequency] = useState<"once" | "weekly">("weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const [previewItems, setPreviewItems] = useState<SessionEditPreviewItem[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoadingDetail(true);
    axiosInstance
      .get<SessionDetailResponse>(`/class-sessions/${params.occurrenceId}`)
      .then((r) => {
        setSessionDetail(r.data);
        const t = r.data.start_time.match(/T(\d{2}):(\d{2})/);
        const time = t ? `${t[1]}:${t[2]}` : "";
        const room = r.data.room_id ?? "";
        const cap = r.data.capacity != null ? String(r.data.capacity) : "";
        const instr = r.data.instructor_id ?? "";
        setStartTime(time);
        setRoomId(room);
        setCapacity(cap);
        setInstructorId(instr);
        setInitialStartTime(time);
        setInitialRoomId(room);
        setInitialCapacity(cap);
        setInitialInstructorId(instr);

        // Derive fromDate and initial selectedDay from calendar_date
        const sessionDate = new Date(r.data.calendar_date + "T00:00:00");
        setFromDate(sessionDate);
        setSelectedDays([WEEKDAY_KEYS[sessionDate.getDay()]]);
      })
      .catch(() => toast({ description: "Nie udało się załadować sesji.", variant: "destructive" }))
      .finally(() => setIsLoadingDetail(false));

    axiosInstance
      .get<{ id: string; name: string }[]>("/instructors")
      .then((r) => setInstructors(r.data ?? []))
      .catch(() => {});
  }, [params.occurrenceId, toast]);

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

  const buildPayload = () => ({
    occurrence_id: params.occurrenceId,
    scope,
    ...(startTime ? { start_time: startTime + ":00" } : {}),
    ...(roomId ? { room_id: roomId } : {}),
    ...(capacity ? { capacity: parseInt(capacity, 10) } : {}),
    ...(instructorId ? { instructor_id: instructorId } : {}),
  });

  const goToPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const r = await axiosInstance.post<SessionEditPreviewResponse>(
        "/class-sessions/edit/preview",
        buildPayload(),
      );
      setPreviewItems(r.data.items);
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
      await axiosInstance.post("/class-sessions/edit/commit", buildPayload());
      toast({ description: "Sesja zaktualizowana." });
      router.push("/profile/schedule");
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
            // no onChangeTemplate → hides the "Zmień" button
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
            onFromDateChange={() => {}}
            disableFromDate
            toDate={toDate}
            onToDateChange={setToDate}
            startTime={startTime}
            onStartTimeChange={setStartTime}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep("scope")}>
              <ArrowLeft size={14} className="mr-1" />
              Wstecz
            </Button>
            <Button className="flex-1" onClick={goToPreview} disabled={isLoadingPreview}>
              {isLoadingPreview ? "Generowanie..." : "Podgląd →"}
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Zmiany w {previewItems.filter((i) => i.action !== "unchanged").length} sesjach
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Sprawdź co się zmieni przed zapisaniem.</p>
          </div>

          <SessionChangesPreview
            items={previewItems.filter((i) => i.action !== "unchanged")}
            initialValues={{
              startTime: initialStartTime,
              instructorId: initialInstructorId,
              roomId: initialRoomId,
              capacityStr: initialCapacity,
            }}
            instructors={instructors}
            rooms={rooms}
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
    </div>
  );
}

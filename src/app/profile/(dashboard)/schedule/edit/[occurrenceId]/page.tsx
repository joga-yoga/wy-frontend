"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import type {
  SessionDetailResponse,
  SessionEditPreviewItem,
  SessionEditPreviewResponse,
} from "../../types";
import { ScopeOptionCard } from "../../components/ScopeOptionCard";
import { SessionChangesPreview } from "../../components/SessionChangesPreview";

type Scope = "single" | "this_and_future" | "whole_series";
type Step = "scope" | "form" | "preview";

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
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);

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
      })
      .catch(() =>
        toast({ description: "Nie udało się załadować sesji.", variant: "destructive" }),
      )
      .finally(() => setIsLoadingDetail(false));

    axiosInstance
      .get<{ id: string; name: string }[]>("/instructors")
      .then((r) => setInstructors(r.data ?? []))
      .catch(() => {});
  }, [params.occurrenceId]);

  useEffect(() => {
    if (!sessionDetail?.studio_id) return;
    axiosInstance
      .get<{ id: string; name: string }[]>(`/studios/${sessionDetail.studio_id}/rooms`)
      .then((r) => setRooms(r.data ?? []))
      .catch(() => {});
  }, [sessionDetail?.studio_id]);

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
          <Button className="w-full" onClick={() => setStep("form")}>
            Dalej →
          </Button>
        </div>
      )}

      {step === "form" && sessionDetail && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-gray-50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{sessionDetail.template_title}</p>
              <p className="text-xs text-gray-500">
                {new Date(sessionDetail.calendar_date + "T00:00:00").toLocaleDateString("pl-PL", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {" · "}
                {sessionDetail.studio_name}
              </p>
            </div>
          </div>

          <div>
            <Label>Godzina</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>

          <div>
            <Label>Prowadzący</Label>
            <div className="flex gap-1.5">
              <Select value={instructorId || undefined} onValueChange={setInstructorId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Wybierz prowadzącego" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {instructorId && (
                <button
                  type="button"
                  onClick={() => setInstructorId("")}
                  className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xs">✕</span>
                </button>
              )}
            </div>
          </div>

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
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roomId && (
                  <button
                    type="button"
                    onClick={() => setRoomId("")}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <Label>Limit</Label>
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Bez limitu"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep("scope")}>
              Wstecz
            </Button>
            <Button
              className="flex-1"
              onClick={goToPreview}
              disabled={isLoadingPreview}
            >
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
            <p className="text-xs text-gray-500 mt-0.5">
              Sprawdź co się zmieni przed zapisaniem.
            </p>
          </div>

          <SessionChangesPreview
            items={previewItems}
            currentOccurrence={sessionDetail}
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

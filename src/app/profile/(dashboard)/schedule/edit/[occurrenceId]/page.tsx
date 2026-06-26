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
import { ScopeOptionCard } from "../../components/ScopeOptionCard";

type Scope = "single" | "this_and_future" | "whole_series";
type Step = "scope" | "form" | "done";

export default function EditSessionPage() {
  const params = useParams<{ occurrenceId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const isSubstitution = searchParams.get("field") === "instructor";

  const [step, setStep] = useState<Step>("scope");
  const [scope, setScope] = useState<Scope>("single");
  const [startTime, setStartTime] = useState("");
  const [roomId, setRoomId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axiosInstance.get<{ id: string; name: string }[]>("/instructors").then((r) => setInstructors(r.data ?? [])).catch(() => {});
  }, []);

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        occurrence_id: params.occurrenceId,
        scope,
      };
      if (startTime) payload.start_time = startTime + ":00";
      if (roomId) payload.room_id = roomId;
      if (capacity) payload.capacity = parseInt(capacity, 10);
      if (instructorId) payload.instructor_id = instructorId;

      await axiosInstance.post("/class-sessions/edit/commit", payload);
      toast({ description: "Sesja zaktualizowana." });
      router.push("/profile/schedule");
    } catch {
      toast({ description: "Nie udało się zapisać zmian.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {step === "form" && (
        <div className="space-y-4">
          {isSubstitution ? (
            <div>
              <Label>Prowadzący</Label>
              <Select value={instructorId} onValueChange={setInstructorId}>
                <SelectTrigger><SelectValue placeholder="Wybierz prowadzącego" /></SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div>
                <Label>Godzina</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label>Prowadzący</Label>
                <Select value={instructorId || undefined} onValueChange={setInstructorId}>
                  <SelectTrigger><SelectValue placeholder="Wybierz prowadzącego" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep("scope")}>
              Wstecz
            </Button>
            <Button
              className="flex-1"
              onClick={handleCommit}
              disabled={isSubmitting || (isSubstitution && !instructorId)}
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz i powiadom"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

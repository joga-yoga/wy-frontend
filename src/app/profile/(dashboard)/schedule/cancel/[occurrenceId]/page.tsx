"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { ScopeOptionCard } from "../../components/ScopeOptionCard";

type CancelScope = "single" | "end_series_from_date";

export default function CancelSessionPage() {
  const params = useParams<{ occurrenceId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [scope, setScope] = useState<CancelScope>("single");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/class-sessions/cancel/commit", {
        occurrence_id: params.occurrenceId,
        scope,
      });
      toast({ description: scope === "single" ? "Sesja odwołana." : "Seria zakończona." });
      router.push("/profile/schedule");
    } catch {
      toast({ description: "Nie udało się odwołać.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto max-w-lg">
      <p className="text-sm font-semibold text-gray-900 mb-4">Co odwołać?</p>

      <div className="space-y-2">
        <ScopeOptionCard
          title="Tylko tę sesję"
          subtitle="Przekreślona, seria trwa, zapisani powiadomieni"
          selected={scope === "single"}
          onSelect={() => setScope("single")}
        />
        <ScopeOptionCard
          title="Zakończ serię od tej daty"
          subtitle="Zapisani odwołani, puste sesje usunięte"
          selected={scope === "end_series_from_date"}
          onSelect={() => setScope("end_series_from_date")}
          variant="danger"
        />
      </div>

      <div className="flex gap-3 pt-6">
        <Button variant="outline" onClick={() => router.back()}>
          Anuluj
        </Button>
        <Button
          className="flex-1"
          variant="destructive"
          onClick={handleCommit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Odwoływanie..." : "Odwołaj"}
        </Button>
      </div>
    </div>
  );
}

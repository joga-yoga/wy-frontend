"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { ScopeOptionCard } from "../../components/ScopeOptionCard";
import { SessionChangesPreview } from "../../components/SessionChangesPreview";
import type { SessionEditPreviewResponse } from "../../types";

type CancelScope = "single" | "end_series_from_date";
type Step = "scope" | "preview";

export default function CancelSessionPage() {
  const params = useParams<{ occurrenceId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [scope, setScope] = useState<CancelScope>("single");
  const [step, setStep] = useState<Step>("scope");
  const [previewResponse, setPreviewResponse] = useState<SessionEditPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const r = await axiosInstance.post<SessionEditPreviewResponse>(
        "/class-sessions/cancel/preview",
        { occurrence_id: params.occurrenceId, scope },
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
      {step === "scope" && (
        <>
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
            <Button variant="outline" onClick={() => router.push("/profile/schedule")}>
              Anuluj
            </Button>
            <Button className="flex-1" onClick={goToPreview} disabled={isLoadingPreview}>
              {isLoadingPreview ? "Generowanie..." : "Podgląd →"}
            </Button>
          </div>
        </>
      )}

      {step === "preview" && previewResponse && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {previewResponse.total_affected === 1
                ? "1 sesja"
                : `${previewResponse.total_affected} sesji`}{" "}
              zostanie odwołana
            </h2>
          </div>

          <SessionChangesPreview
            items={previewResponse.items}
            notificationSummary={previewResponse.notification_summary}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("scope")}>
              Wstecz
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
      )}
    </div>
  );
}

"use client";

import { Check } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { ScopeOptionCard } from "../../components/ScopeOptionCard";
import { SessionChangesPreview } from "../../components/SessionChangesPreview";
import type { SessionEditCommitResponse, SessionEditPreviewResponse } from "../../types";

type CancelScope = "single" | "end_series_from_date";
type Step = "scope" | "preview" | "success";

function isFewForm(n: number): boolean {
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
}

function sesjaNominative(n: number): string {
  if (n === 1) return "sesja";
  return isFewForm(n) ? "sesje" : "sesji";
}

function odwolanaAgreement(n: number): string {
  if (n === 1) return "zostanie odwołana";
  return isFewForm(n) ? "zostaną odwołane" : "zostanie odwołanych";
}

function odwolanaForm(n: number): string {
  if (n === 1) return "odwołana";
  return isFewForm(n) ? "odwołane" : "odwołanych";
}

export default function CancelSessionPage() {
  const params = useParams<{ occurrenceId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [scope, setScope] = useState<CancelScope>("single");
  const [step, setStep] = useState<Step>("scope");
  const [previewResponse, setPreviewResponse] = useState<SessionEditPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commitResult, setCommitResult] = useState<SessionEditCommitResponse | null>(null);

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
      const { data } = await axiosInstance.post<SessionEditCommitResponse>(
        "/class-sessions/cancel/commit",
        { occurrence_id: params.occurrenceId, scope },
      );
      setCommitResult(data);
      setStep("success");
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
            <Button variant="outline" onClick={() => router.push("/konto/partner/grafik")}>
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
              {previewResponse.total_affected} {sesjaNominative(previewResponse.total_affected)}{" "}
              {odwolanaAgreement(previewResponse.total_affected)}
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

      {step === "success" && commitResult && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-brand-green-700">
            <Check size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {scope === "single" ? "Sesja odwołana" : "Seria zakończona"}
            </h2>
            <p className="text-sm text-gray-500">
              {commitResult.cancelled.length} {sesjaNominative(commitResult.cancelled.length)}{" "}
              {odwolanaForm(commitResult.cancelled.length)}. Powiadomienia trafiły do kolejki
              wysyłki.
            </p>
          </div>
          <Button className="w-full" onClick={() => router.push("/konto/partner/grafik")}>
            Wróć do grafiku
          </Button>
        </div>
      )}
    </div>
  );
}

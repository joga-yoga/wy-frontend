"use client";

import { Info } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SessionContextCard } from "@/components/b2b/SessionContextCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { isFewForm } from "@/lib/polishPlural";

import { ScheduleSuccessScreen } from "../../components/ScheduleSuccessScreen";
import { ScopeOptionCard } from "../../components/ScopeOptionCard";
import { PreviewNoteCard, SessionChangesPreview } from "../../components/SessionChangesPreview";
import type {
  SessionDetailResponse,
  SessionEditCommitResponse,
  SessionEditPreviewResponse,
} from "../../types";

type CancelScope = "single" | "end_series_from_date";
type Step = "scope" | "preview" | "success";

function sesjaNominative(n: number): string {
  if (n === 1) return "sesja";
  return isFewForm(n) ? "sesje" : "sesji";
}

function odwolanaForm(n: number): string {
  if (n === 1) return "odwołana";
  return isFewForm(n) ? "odwołane" : "odwołanych";
}

function usunietaForm(n: number): string {
  if (n === 1) return "usunięta";
  return isFewForm(n) ? "usunięte" : "usuniętych";
}

/**
 * Cancelling a session with bookings marks it `cancelled`; cancelling an **empty** one deletes
 * it outright. Counting only `cancelled` therefore reported "0 sesji odwołanych" after
 * successfully removing an empty session — telling the user nothing had happened.
 */
function cancelOutcome(r: SessionEditCommitResponse): { total: number; summary: string } {
  const parts = [
    r.cancelled.length > 0 ? `${r.cancelled.length} ${odwolanaForm(r.cancelled.length)}` : null,
    r.deleted.length > 0 ? `${r.deleted.length} ${usunietaForm(r.deleted.length)}` : null,
  ].filter(Boolean);
  return {
    total: r.cancelled.length + r.deleted.length,
    summary: parts.join(" · ") || "Brak zmian",
  };
}

function cancelDate(dateStr: string): string {
  const label = new Date(dateStr + "T00:00:00").toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function cancelTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function cancelDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export default function CancelSessionPage() {
  const params = useParams<{ occurrenceId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [scope, setScope] = useState<CancelScope>("single");
  const [step, setStep] = useState<Step>("scope");
  const [previewResponse, setPreviewResponse] = useState<SessionEditPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commitResult, setCommitResult] = useState<SessionEditCommitResponse | null>(null);

  useEffect(() => {
    axiosInstance
      .get<SessionDetailResponse>(`/class-sessions/${params.occurrenceId}`)
      .then((r) => setSessionDetail(r.data))
      .catch(() => setSessionDetail(null));
  }, [params.occurrenceId]);

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
        <div className="space-y-4">
          {sessionDetail && (
            <SessionContextCard
              tone="danger"
              title={sessionDetail.template_title}
              date={cancelDate(sessionDetail.calendar_date)}
              time={cancelTime(sessionDetail.start_time)}
              durationMinutes={cancelDurationMinutes(
                sessionDetail.start_time,
                sessionDetail.end_time,
              )}
              color={sessionDetail.color}
            />
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Co odwołać?
          </p>
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
          <div className="flex gap-3 pt-2">
            <Button
              size="action"
              variant="outline"
              onClick={() => router.push("/account/partner/schedule")}
            >
              Anuluj
            </Button>
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

      {step === "preview" && previewResponse && (
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {previewResponse.total_affected === 1
              ? "ZMIANA W 1 SESJI"
              : `ZMIANY W ${previewResponse.total_affected} SESJACH`}
          </p>

          <SessionChangesPreview
            items={previewResponse.items}
            notificationSummary={previewResponse.notification_summary}
          />

          <PreviewNoteCard icon={<Info size={15} />}>
            {scope === "single"
              ? "Dotyczy tylko tej sesji — seria bez zmian. Rezerwacje zostaną anulowane, karnety odzyskają wejścia (bezpłatne odwołanie po stronie studia)."
              : "Seria zakończy się tą datą. Rezerwacje zostaną anulowane, karnety odzyskają wejścia (bezpłatne odwołanie po stronie studia)."}
          </PreviewNoteCard>

          <div className="flex gap-3 pt-2">
            <Button size="action" variant="outline" onClick={() => setStep("scope")}>
              Wstecz
            </Button>
            <Button
              size="action"
              className="flex-1"
              variant="danger"
              onClick={handleCommit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Odwoływanie..." : "Odwołaj sesję"}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && commitResult && (
        <ScheduleSuccessScreen
          headline={scope === "single" ? "Sesja odwołana" : "Seria zakończona"}
          body={`${cancelOutcome(commitResult).total} ${sesjaNominative(cancelOutcome(commitResult).total)} ${cancelOutcome(commitResult).total === commitResult.deleted.length ? usunietaForm(cancelOutcome(commitResult).total) : odwolanaForm(cancelOutcome(commitResult).total)}. Powiadomienia trafiły do kolejki wysyłki.`}
          summary={cancelOutcome(commitResult).summary}
        />
      )}
    </div>
  );
}

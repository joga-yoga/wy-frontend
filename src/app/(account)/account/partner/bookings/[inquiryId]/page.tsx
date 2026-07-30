"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { Button } from "@/components/ui/button";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { InquiryItem } from "@/lib/inboxTypes";

const EVENT_TYPE_LABELS: Record<string, string> = {
  retreat: "Wyjazd",
  workshop: "Wydarzenie",
  course: "Kurs",
  class: "Zajęcia",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Unified inquiry detail — replaces the split zamowienia/wiadomosci pair, which were
 * two separate screens over the same `Inquiry` row (a pre-T12 leftover from before the
 * `ReservationRequest`/`ContactRequest` merge). This is intentionally *not* a message
 * thread (spec-b2b §4's non-goal) — just the full message plus the handled toggle.
 */
export default function InquiryDetailPage() {
  const params = useParams<{ inquiryId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { capabilities } = usePartnerCapabilities();
  const [inquiry, setInquiry] = useState<InquiryItem | null>(null);
  const [selfInstructorId, setSelfInstructorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    axiosInstance
      .get<InquiryItem>(`/partner/inbox/${params.inquiryId}`)
      .then(({ data }) => setInquiry(data))
      .catch(() => {
        toast({ description: "Nie udało się wczytać wiadomości.", variant: "destructive" });
        router.push("/konto/partner/rezerwacje");
      })
      .finally(() => setIsLoading(false));
    axiosInstance
      .get<Array<{ id: string; is_claimed: boolean }>>("/instructors")
      .then(({ data }) => setSelfInstructorId(data.find((i) => i.is_claimed)?.id ?? null))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.inquiryId]);

  async function toggleHandled() {
    if (!inquiry) return;
    setIsUpdating(true);
    try {
      if (inquiry.status === "handled") {
        const { data } = await axiosInstance.delete<InquiryItem>(
          `/partner/inbox/${inquiry.id}/handled`,
        );
        setInquiry(data);
      } else {
        const actingStudioId = inquiry.studio_id ?? capabilities?.managedStudios[0]?.id ?? null;
        const actingInstructorId = inquiry.instructor_id ?? selfInstructorId ?? null;
        const { data } = await axiosInstance.post<InquiryItem>(
          `/partner/inbox/${inquiry.id}/handled`,
          actingStudioId ? { studio_id: actingStudioId } : { instructor_id: actingInstructorId },
        );
        setInquiry(data);
      }
    } catch {
      toast({ description: "Nie udało się zapisać zmiany.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading || !inquiry) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const displayName = inquiry.author?.email ?? "Nieznany nadawca";
  const typeLabel = inquiry.event_type ? EVENT_TYPE_LABELS[inquiry.event_type] : null;

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      <div className="flex items-center gap-3">
        <HashedAvatar seed={inquiry.author?.id ?? inquiry.id} name={displayName} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-400">{formatDateTime(inquiry.created_at)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {typeLabel && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {typeLabel}
          </span>
        )}
        {inquiry.kind === "question" && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            Pytanie
          </span>
        )}
        {inquiry.source_label && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            jako: {inquiry.source_label}
          </span>
        )}
        {inquiry.status === "handled" && (
          <StatusChip tone="green">
            Odpowiedziano{inquiry.handled_by_label ? ` · ${inquiry.handled_by_label}` : ""}
          </StatusChip>
        )}
      </div>

      {inquiry.event_title && (
        <div className="rounded-xl border bg-white px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Wydarzenie</p>
          <p className="mt-0.5 text-sm font-medium text-gray-900">{inquiry.event_title}</p>
        </div>
      )}

      {inquiry.message && (
        <div className="rounded-xl border bg-white px-4 py-3.5">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
        </div>
      )}

      {inquiry.preferred_contact && (
        <p className="px-1 text-xs text-gray-500">
          Preferowany kontakt: {inquiry.preferred_contact}
        </p>
      )}

      <Button
        variant={inquiry.status === "handled" ? "outline" : "green"}
        className="w-full"
        onClick={toggleHandled}
        disabled={isUpdating}
      >
        {inquiry.status === "handled" ? "Cofnij oznaczenie" : "Oznacz jako odpowiedziane"}
      </Button>
    </div>
  );
}

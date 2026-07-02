"use client";

import { Clock, Info, MapPin, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";

import type { PublicOccurrence } from "./types";

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "short" });
}

function formatCancellationDeadline(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  const timePart = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} o ${timePart}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function InstructorAvatar({ name, imageId }: { name: string; imageId?: string | null }) {
  if (imageId) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <WyImage src={imageId} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-semibold text-amber-800">
      {initials(name)}
    </div>
  );
}

interface SessionDetailModalProps {
  occ: PublicOccurrence | null;
  onClose: () => void;
}

export function SessionDetailModal({ occ, onClose }: SessionDetailModalProps) {
  const router = useRouter();

  if (!occ) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="min-w-0 truncate text-base font-semibold text-gray-900">
          {occ.template_title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij"
          className="shrink-0 rounded-full p-1.5 hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Clock className="h-5 w-5 shrink-0 text-gray-400" />
          <span className="capitalize">
            {formatDayHeader(occ.calendar_date)} · {formatTime(occ.start_time)}–
            {formatTime(occ.end_time)}
          </span>
        </div>

        {occ.instructor_name && (
          <div className="flex items-center gap-3">
            <InstructorAvatar name={occ.instructor_name} imageId={occ.instructor_image_id} />
            <span className="text-sm font-medium text-gray-900">{occ.instructor_name}</span>
          </div>
        )}

        {occ.room_name && (
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <MapPin className="h-5 w-5 shrink-0 text-gray-400" />
            {occ.room_name}
          </div>
        )}

        {occ.capacity != null && (
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Users className="h-5 w-5 shrink-0 text-gray-400" />
            Limit: {occ.capacity} miejsc
          </div>
        )}

        {occ.important_info && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            <Info className="h-5 w-5 shrink-0" />
            <p>{occ.important_info}</p>
          </div>
        )}

        <div className="rounded-lg border bg-gray-50 px-3 py-3 text-sm text-gray-600">
          {occ.free_cancellation_deadline
            ? `Bezpłatne odwołanie do ${formatCancellationDeadline(occ.free_cancellation_deadline)}.`
            : "Bezpłatne odwołanie w dowolnym momencie."}
        </div>
      </div>

      <div className="border-t bg-white px-4 py-3 pb-6 shadow-[0_-4px_16px_0_rgba(0,0,0,0.06)]">
        <Button
          variant="cta"
          size="cta"
          className="w-full"
          onClick={() => router.push(`/book/class/${occ.id}`)}
        >
          Zarezerwuj
        </Button>
      </div>
    </div>
  );
}

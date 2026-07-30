"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { WyImage } from "@/components/custom/WyImage";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";

import type { RosterRowState, StudioRosterItem, StudioRosterResponse } from "./types";

const CHIP: Record<RosterRowState, { label: string; tone: "green" | "amber" | "gray" }> = {
  self: { label: "To Ty", tone: "gray" },
  linked: { label: "Połączono", tone: "green" },
  awaiting: { label: "Oczekuje", tone: "amber" },
  no_account: { label: "Bez konta", tone: "gray" },
};

function subtitleFor(item: StudioRosterItem): { text: string; amber: boolean } {
  switch (item.row_state) {
    case "self":
      return { text: "Twój profil instruktora", amber: false };
    case "linked":
      return { text: "Zarządza swoim profilem", amber: false };
    case "awaiting":
      return { text: "profil w Twoim zarządzaniu", amber: false };
    case "no_account":
      return { text: "Zaproszenie niewysłane — dodaj email", amber: true };
  }
}

function Avatar({ name, imageId }: { name: string; imageId: string | null }) {
  if (imageId) {
    return (
      <WyImage
        src={imageId}
        alt={name}
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function InstructorsRosterPage() {
  const { studio, isLoading: isStudioLoading } = useCurrentStudio();
  const [roster, setRoster] = useState<StudioRosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studio) return;
    setIsLoading(true);
    axiosInstance
      .get<StudioRosterResponse>(`/studios/${studio.id}/roster`)
      .then(({ data }) => setRoster(data))
      .catch(() => setRoster(null))
      .finally(() => setIsLoading(false));
  }, [studio]);

  if (isStudioLoading || isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5">
        <p className="text-sm text-gray-500">Nie znaleziono studia.</p>
      </div>
    );
  }

  const items = roster?.items ?? [];
  const countLine =
    items.length === 0
      ? "Brak instruktorów"
      : `${items.length} ${items.length === 1 ? "osoba" : "osób"}` +
        (roster && roster.awaiting_count > 0
          ? ` · ${roster.awaiting_count} oczekuje na zaproszenie`
          : "");

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      <p className="px-1 text-sm text-gray-500">{countLine}</p>

      <div className="rounded-xl border bg-white overflow-hidden divide-y">
        {items.map((item) => {
          const chip = CHIP[item.row_state];
          const subtitle = subtitleFor(item);
          return (
            <Link
              key={item.id}
              href={`/konto/partner/instruktorzy/${item.id}${
                studio ? `?studioId=${studio.id}` : ""
              }`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <Avatar name={item.name} imageId={item.image_id} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                <p
                  className={`truncate text-xs ${subtitle.amber ? "text-amber-700 font-medium" : "text-gray-500"}`}
                >
                  {subtitle.text}
                </p>
              </div>
              <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
            </Link>
          );
        })}

        <Link
          href={`/konto/partner/instruktorzy/create?studioId=${studio.id}`}
          className="flex items-center justify-center gap-1.5 px-4 py-3.5 text-sm font-semibold text-brand-green-700 hover:bg-gray-50 transition-colors"
        >
          <Plus size={16} />
          Dodaj instruktora
        </Link>
      </div>

      <p className="px-1 text-xs text-gray-400 leading-relaxed">
        Oczekujący instruktorzy są już widoczni w grafiku i na stronie studia. Na ich publicznym
        profilu studio pojawi się po akceptacji zaproszenia.
      </p>
    </div>
  );
}

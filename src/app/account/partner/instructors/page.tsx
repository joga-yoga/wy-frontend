"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { InfoNote } from "@/components/b2b/InfoNote";
import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";
import { osobyNom, plural } from "@/lib/polishPlural";

import { InstructorConnectionSheet } from "./components/InstructorConnectionSheet";
import type {
  RosterRowState,
  StudioRosterDetachResponse,
  StudioRosterItem,
  StudioRosterResponse,
} from "./types";

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
      // R2 puts the invite date here rather than the edit-rights fact — "when did we ask
      // them?" is the question a pending row actually raises, and the chip already says
      // the profile is unclaimed.
      return {
        text: item.invited_at
          ? `Zaproszenie wysłane ${new Date(item.invited_at).toLocaleDateString("pl-PL", {
              day: "numeric",
              month: "short",
            })}`
          : "Profil w Twoim zarządzaniu",
        amber: false,
      };
    case "no_account":
      return { text: "Zaproszenie niewysłane — dodaj email", amber: true };
  }
}

export default function InstructorsRosterPage() {
  const { studio, isLoading: isStudioLoading } = useCurrentStudio();
  const [roster, setRoster] = useState<StudioRosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetItem, setSheetItem] = useState<StudioRosterItem | null>(null);
  const [isDetaching, setIsDetaching] = useState(false);
  const { toast } = useToast();

  async function handleDetach() {
    if (!studio || !sheetItem) return;
    setIsDetaching(true);
    try {
      const { data } = await axiosInstance.delete<StudioRosterDetachResponse>(
        `/studios/${studio.id}/roster/${sheetItem.id}`,
      );
      toast({
        description: data.has_future_sessions
          ? `Odłączono. ${sheetItem.name} pozostaje przypisana/y do ${data.future_session_count} nadchodzących sesji — zmień prowadzącego w Grafiku.`
          : "Odłączono od studia.",
      });
      setRoster((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.id !== sheetItem.id),
              total: prev.total - 1,
            }
          : prev,
      );
      setSheetItem(null);
    } catch {
      toast({ description: "Nie udało się odłączyć instruktora.", variant: "destructive" });
    } finally {
      setIsDetaching(false);
    }
  }

  useEffect(() => {
    // Clearing isLoading here is load-bearing: `useCurrentStudio` legitimately resolves
    // `null` for a partner with no managed studio, and bailing out without it left the
    // spinner running forever — which also made the "no studio" branch below unreachable.
    if (!studio) {
      setIsLoading(false);
      return;
    }
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

  // Reached by a partner who simply has no studio — a normal state, not a lookup failure,
  // so the copy says what to do rather than reading as an error.
  if (!studio) {
    return (
      <div className="max-w-lg mx-auto space-y-3 px-4 py-5 text-center">
        <p className="text-sm font-semibold text-gray-900">Nie masz jeszcze studia</p>
        <p className="text-sm text-gray-500">
          Instruktorzy są przypisani do studia. Utwórz studio w Menu, aby zarządzać zespołem.
        </p>
        <Link href="/account/partner/menu" className="inline-block">
          <Button size="action" variant="green" className="rounded-full">
            Przejdź do Menu
          </Button>
        </Link>
      </div>
    );
  }

  const items = roster?.items ?? [];
  const countLine =
    items.length === 0
      ? "Brak instruktorów"
      : osobyNom(items.length) +
        (roster && roster.awaiting_count > 0
          ? ` · ${roster.awaiting_count} ${plural(
              roster.awaiting_count,
              "oczekuje",
              "oczekują",
              "oczekuje",
            )} na zaproszenie`
          : "");

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      <p className="px-1 text-sm text-gray-500">{countLine}</p>

      <div className="rounded-b2b border bg-white overflow-hidden divide-y">
        {items.map((item) => {
          const chip = CHIP[item.row_state];
          const subtitle = subtitleFor(item);
          const body = (
            <>
              <HashedAvatar seed={item.id} name={item.name} imageId={item.image_id} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                <p
                  className={`truncate text-xs ${
                    subtitle.amber ? "font-medium text-b2b-amber-text" : "text-gray-500"
                  }`}
                >
                  {subtitle.text}
                </p>
              </div>
              <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
              <IoChevronForward className="h-4 w-4 shrink-0 text-gray-300" />
            </>
          );

          // A claimed profile is read-only, so it opens the connection sheet (R6) rather
          // than pushing a screen whose only message is "you cannot edit this".
          if (!item.can_edit_profile) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSheetItem(item)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                {body}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={`/account/partner/instructors/${item.id}${
                studio ? `?studioId=${studio.id}` : ""
              }`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              {body}
            </Link>
          );
        })}

        <Link
          href={`/account/partner/instructors/create?studioId=${studio.id}`}
          className="flex items-center justify-center gap-1.5 px-4 py-3.5 text-sm font-semibold text-b2b-green-text transition-colors hover:bg-gray-50"
        >
          <Plus size={16} />
          Dodaj instruktora
        </Link>
      </div>

      <InfoNote>
        Oczekujący instruktorzy są już widoczni w grafiku i na stronie studia. Na ich publicznym
        profilu studio pojawi się po akceptacji zaproszenia.
      </InfoNote>

      <InstructorConnectionSheet
        item={sheetItem}
        open={sheetItem !== null}
        onOpenChange={(next) => !next && setSheetItem(null)}
        onDetach={handleDetach}
        isDetaching={isDetaching}
      />
    </div>
  );
}

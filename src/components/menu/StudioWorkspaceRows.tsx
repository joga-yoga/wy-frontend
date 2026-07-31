"use client";

import { CreditCard, Layers, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { StudioLogoTile } from "@/components/b2b/StudioLogoTile";
import { MenuRow } from "@/components/menu/MenuRow";
import { axiosInstance } from "@/lib/axiosInstance";
import { osobyNom, plural } from "@/lib/polishPlural";

interface RosterSummary {
  total: number;
  awaiting_count: number;
}

function rosterSubtitle(summary: RosterSummary | null): string {
  if (!summary) return "Zarządzaj zespołem studia";
  if (summary.total === 0) return "Brak instruktorów";
  const base = osobyNom(summary.total);
  if (summary.awaiting_count === 0) return base;
  // The verb agrees too, not just the noun: "2 oczekują", but "1 oczekuje" and
  // "5 oczekuje". A count-only plural gives "2 oczekuje na zaproszenie".
  const verb = plural(summary.awaiting_count, "oczekuje", "oczekują", "oczekuje");
  return `${base} · ${summary.awaiting_count} ${verb} na zaproszenie`;
}

/**
 * The 5 workspace rows for a single managed studio (spec-b2b §4). Shared between
 * Menu's 1-studio flattened layout and the per-studio workspace screen (2+ studios).
 */
export function StudioWorkspaceRows({
  studioId,
  studioName,
  studioImageId,
}: {
  studioId: string;
  studioName: string;
  studioImageId?: string | null;
}) {
  const [roster, setRoster] = useState<RosterSummary | null>(null);

  useEffect(() => {
    axiosInstance
      .get<RosterSummary>(`/studios/${studioId}/roster`)
      .then(({ data }) => setRoster(data))
      .catch(() => setRoster(null));
  }, [studioId]);

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {studioName} · Twoje studio
      </h2>
      <div className="rounded-b2b border bg-white overflow-hidden divide-y">
        {/* R1 leads this row with the studio's own logo rather than a generic icon —
            it is the only row that is *about* a specific studio. */}
        <MenuRow
          href={`/konto/partner/studio/${studioId}/edit`}
          title="Profil studia"
          subtitle="Podstawy, lokalizacja, cennik, zdjęcia"
          leading={<StudioLogoTile name={studioName} imageId={studioImageId} />}
        />
        <MenuRow
          href={`/konto/partner/instruktorzy?studioId=${studioId}`}
          title="Instruktorzy"
          subtitle={rosterSubtitle(roster)}
          Icon={Users}
        />
        <MenuRow
          href={`/konto/partner/klienci?studioId=${studioId}`}
          title="Klienci"
          subtitle="Karnety i wizyty"
          Icon={Users}
        />
        <MenuRow
          href="/konto/partner/szablony-zajec"
          title="Szablony zajęć"
          subtitle="Zarządzaj grafikiem zajęć"
          Icon={Layers}
        />
        <MenuRow
          href={`/konto/partner/studio/${studioId}/payments`}
          title="Płatności i odwołania"
          subtitle="Metody płatności, polityka odwołań"
          Icon={CreditCard}
        />
      </div>
    </section>
  );
}

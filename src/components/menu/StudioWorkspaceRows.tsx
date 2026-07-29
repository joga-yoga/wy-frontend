"use client";

import { Building2, CreditCard, Layers, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { MenuRow } from "@/components/menu/MenuRow";
import { axiosInstance } from "@/lib/axiosInstance";

interface RosterSummary {
  total: number;
  awaiting_count: number;
}

function rosterSubtitle(summary: RosterSummary | null): string {
  if (!summary) return "Zarządzaj zespołem studia";
  if (summary.total === 0) return "Brak instruktorów";
  const base = `${summary.total} ${summary.total === 1 ? "osoba" : "osób"}`;
  return summary.awaiting_count > 0
    ? `${base} · ${summary.awaiting_count} oczekuje na zaproszenie`
    : base;
}

/**
 * The 5 workspace rows for a single managed studio (spec-b2b §4). Shared between
 * Menu's 1-studio flattened layout and the per-studio workspace screen (2+ studios).
 */
export function StudioWorkspaceRows({
  studioId,
  studioName,
}: {
  studioId: string;
  studioName: string;
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
      <div className="rounded-xl border bg-white overflow-hidden divide-y">
        <MenuRow
          href={`/konto/partner/studio/${studioId}/edit`}
          title="Profil studia"
          subtitle="Podstawy, lokalizacja, cennik, zdjęcia"
          Icon={Building2}
        />
        <MenuRow
          href="/konto/partner/instruktorzy"
          title="Instruktorzy"
          subtitle={rosterSubtitle(roster)}
          Icon={Users}
        />
        <MenuRow
          href="/konto/partner/klienci"
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

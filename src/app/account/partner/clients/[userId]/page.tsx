"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ClientVisitRow } from "@/components/b2b/ClientVisitRow";
import { PassCard } from "@/components/b2b/PassCard";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";
import { personInitials, personLabel } from "@/lib/personDisplay";

import type { ClientDetail } from "../types";

// "od {month}" takes the genitive case in Polish ("od lipca", not "od lipiec") —
// Intl only gives the nominative, so the mapping is hardcoded.
const GENITIVE_MONTHS_PL = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

function formatSince(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  // K2 writes "klientka od maja 2026" because it draws a woman; "klient" as the generic
  // is the masculine form. Neither works for an arbitrary row, so the noun goes.
  return `w studiu od ${GENITIVE_MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ClientDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { studio } = useCurrentStudio();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studio) return;
    setIsLoading(true);
    axiosInstance
      .get<ClientDetail>(`/studios/${studio.id}/clients/${params.userId}`)
      .then(({ data }) => setClient(data))
      .catch(() => {
        toast({ description: "Nie udało się wczytać klienta.", variant: "destructive" });
        router.push("/account/partner/clients");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio, params.userId]);

  if (isLoading || !client || !studio) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const displayName = client.name || client.email;
  const since = formatSince(client.client_since);

  const label = personLabel(client.name, client.email);

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      {/* K2's identity block. `personLabel` returns a secondary only when it is not the
          primary — the duplicate-email slip this exact screen shipped once already. */}
      <div className="flex items-center gap-3">
        <HashedAvatar
          seed={client.user_id}
          name={label.primary}
          initialsOverride={personInitials(client.name, client.email)}
          size={48}
        />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-gray-900">{label.primary}</h1>
          <p className="truncate text-xs text-gray-500">
            {[label.secondary, since].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Karnet</h2>
        {client.wallet ? (
          // The card is the doorway to the full history (K3) — a client with one visible
          // pass usually has others behind it, and the card is where you look for them.
          <Link
            href={`/account/partner/clients/${client.user_id}/passes?studioId=${studio.id}`}
            className="block transition-opacity hover:opacity-90"
          >
            <PassCard pass={client.wallet} />
          </Link>
        ) : (
          <div className="rounded-b2b border border-dashed bg-white px-4 py-4 text-center text-sm text-gray-400">
            Brak karnetu
          </div>
        )}
      </section>

      {/* Outline, not green: the primary green is the desk's settle action. Selling from
          a profile is navigation into a flow, not the flow's own commit. */}
      <Button size="action" variant="outline" className="w-full" asChild>
        <Link
          href={`/account/partner/studio/${studio.id}/front-desk/sell-pass?userId=${client.user_id}&email=${encodeURIComponent(client.email)}`}
        >
          Sprzedaj karnet
        </Link>
      </Button>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Ostatnie wizyty
        </h2>
        {client.recent_visits.length === 0 ? (
          <p className="px-1 text-sm text-gray-400">Brak wizyt.</p>
        ) : (
          <div className="overflow-hidden rounded-b2b border bg-white divide-y">
            {client.recent_visits.map((v) => (
              <ClientVisitRow key={v.booking_id} visit={v} />
            ))}
            {/* K2 puts the count in the link. "Wszystkie wizyty (14)" tells you whether
                opening it is worth it; "Pełna historia" does not. */}
            <Link
              href={`/account/partner/clients/${client.user_id}/visits?studioId=${studio.id}`}
              className="flex items-center justify-center gap-1 px-4 py-3 text-sm font-semibold text-b2b-green-text transition-colors hover:bg-gray-50"
            >
              Wszystkie wizyty ({client.visit_count})
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

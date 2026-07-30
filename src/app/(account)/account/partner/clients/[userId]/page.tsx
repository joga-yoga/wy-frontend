"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ClientVisitRow } from "@/components/b2b/ClientVisitRow";
import { PassWalletCard } from "@/components/b2b/PassWalletCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";

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
  return `klient od ${GENITIVE_MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
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
        router.push("/konto/partner/klienci");
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

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>
        {displayName !== client.email && <p className="text-sm text-gray-500">{client.email}</p>}
        {since && <p className="mt-0.5 text-xs text-gray-400">{since}</p>}
      </div>

      <PassWalletCard wallet={client.wallet} />

      <Button variant="green" className="w-full" asChild>
        <Link
          href={`/konto/partner/studio/${studio.id}/front-desk/sell-pass?userId=${client.user_id}&email=${encodeURIComponent(client.email)}`}
        >
          Sprzedaj karnet
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Wizyty</h2>
          <Link
            href={`/konto/partner/klienci/${client.user_id}/wizyty?studioId=${studio.id}`}
            className="text-xs font-medium text-brand-green-700 flex items-center gap-0.5"
          >
            Pełna historia
            <ChevronRight size={14} />
          </Link>
        </div>
        {client.recent_visits.length === 0 ? (
          <p className="px-1 text-sm text-gray-400">Brak wizyt.</p>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden divide-y">
            {client.recent_visits.map((v) => (
              <ClientVisitRow key={v.booking_id} visit={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

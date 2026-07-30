"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { Input } from "@/components/ui/input";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";

import type { ChipState, ClientChipOut, ClientListItem } from "./types";

function chipLabel(chip: ClientChipOut): { text: string; tone: "amber" | "green" | "gray" } {
  switch (chip.state as ChipState) {
    case "debt":
      return { text: `Do zapłaty · ${chip.amount_due?.toLocaleString("pl-PL")} zł`, tone: "amber" };
    case "pass":
      return {
        text:
          chip.entries_left === -1
            ? "Karnet · bez limitu"
            : `Karnet · zostały ${chip.entries_left}`,
        tone: "green",
      };
    case "expired":
      return {
        text: chip.expired_on
          ? `Karnet wygasł ${new Date(chip.expired_on).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`
          : "Karnet wygasł",
        tone: "gray",
      };
    case "card":
      return { text: "Karta sportowa", tone: "gray" };
    case "no_pass":
    default:
      return { text: "Bez karnetu", tone: "gray" };
  }
}

function formatLastVisit(iso: string | null): string | null {
  if (!iso) return null;
  return `ostatnia wizyta ${new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`;
}

export default function ClientsListPage() {
  const { studio, isLoading: isStudioLoading } = useCurrentStudio();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studio) return;
    setIsLoading(true);
    const handle = setTimeout(() => {
      axiosInstance
        .get<ClientListItem[]>(`/studios/${studio.id}/clients`, {
          params: search ? { search } : undefined,
        })
        .then(({ data }) => setClients(data))
        .catch(() => setClients([]))
        .finally(() => setIsLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [studio, search]);

  if (isStudioLoading || !studio) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po imieniu lub e-mailu..."
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && clients && clients.length === 0 && (
        <p className="px-1 py-8 text-center text-sm text-gray-400">
          {search ? "Brak wyników." : "Brak klientów studia."}
        </p>
      )}

      {!isLoading && clients && clients.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden divide-y">
          {clients.map((client) => {
            const chip = chipLabel(client.chip);
            const displayName = client.name || client.email;
            const lastVisit = formatLastVisit(client.last_visit);
            return (
              <Link
                key={client.user_id}
                href={`/konto/partner/klienci/${client.user_id}?studioId=${studio.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StatusChip tone={chip.tone}>{chip.text}</StatusChip>
                    {lastVisit && (
                      <span className="truncate text-xs text-gray-400">{lastVisit}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

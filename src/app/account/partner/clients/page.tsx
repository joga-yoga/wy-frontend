"use client";

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { InfoNote } from "@/components/b2b/InfoNote";
import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { formatMoney } from "@/components/page-contents/studio/pricingHelpers";
import { Input } from "@/components/ui/input";
import { useSetPageSubtitle } from "@/context/PageHeaderContext";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";
import { personInitials, personLabel } from "@/lib/personDisplay";
import { osobyNom } from "@/lib/polishPlural";

import type { ChipState, ClientChipOut, ClientListItem } from "./types";

function chipLabel(chip: ClientChipOut): { text: string; tone: "amber" | "green" | "gray" } {
  switch (chip.state as ChipState) {
    case "debt":
      return { text: `Do zapłaty · ${formatMoney(chip.amount_due)}`, tone: "amber" };
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
  const date = new Date(iso);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  // K1 writes "ostatnia wizyta: dziś" rather than today's date — the whole point of the
  // line is recency, and a date the reader has to compare against today buries it.
  const when = isToday
    ? "dziś"
    : date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  return `ostatnia wizyta: ${when}`;
}

export default function ClientsListPage() {
  const { studio, isLoading: isStudioLoading } = useCurrentStudio();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // K1 puts "248 osób" under the title. It counts the *studio's* clients, so it is
  // captured on the unfiltered load and left alone while searching — a search that
  // narrows to 3 results has not changed how many clients the studio has.
  useSetPageSubtitle(totalCount === null ? null : osobyNom(totalCount));

  useEffect(() => {
    if (!studio) return;
    setIsLoading(true);
    const handle = setTimeout(() => {
      axiosInstance
        .get<ClientListItem[]>(`/studios/${studio.id}/clients`, {
          params: search ? { search } : undefined,
        })
        .then(({ data }) => {
          setClients(data);
          if (!search) setTotalCount(data.length);
        })
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
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Imię, nazwisko lub email..."
          className="h-11 rounded-full border-gray-200 bg-gray-50 pl-10"
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
        <div className="rounded-b2b border bg-white overflow-hidden divide-y">
          {clients.map((client) => {
            const chip = chipLabel(client.chip);
            const displayName = client.name || client.email;
            const lastVisit = formatLastVisit(client.last_visit);
            return (
              <Link
                key={client.user_id}
                href={`/account/partner/clients/${client.user_id}?studioId=${studio.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <HashedAvatar
                  seed={client.user_id}
                  name={personLabel(client.name, client.email).primary}
                  initialsOverride={personInitials(client.name, client.email)}
                  size={44}
                />
                {/* K1 stacks these: name, then the chip on its own line, then the last
                    visit. The chip earns the space — an amber "Do zapłaty · 150 zł" is
                    how a debtor surfaces without anyone opening a profile. */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                  <div className="mt-1">
                    <StatusChip tone={chip.tone}>{chip.text}</StatusChip>
                  </div>
                  {lastVisit && <p className="mt-1 truncate text-xs text-gray-400">{lastVisit}</p>}
                </div>
                <IoChevronForward className="h-4 w-4 shrink-0 self-center text-gray-300" />
              </Link>
            );
          })}
        </div>
      )}

      {!isLoading && clients && clients.length > 0 && (
        <InfoNote icon={<Users size={15} />}>
          Klientem jest każdy z rezerwacją, karnetem lub zakupem w tym studiu — lista buduje się
          sama.
        </InfoNote>
      )}
    </div>
  );
}

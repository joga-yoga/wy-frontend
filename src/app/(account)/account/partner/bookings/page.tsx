"use client";

import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarPlus, ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { flattenInbox, InboxResponse, InquiryItem } from "@/lib/inboxTypes";

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: pl });
  } catch {
    return "";
  }
}

/**
 * Rezerwacje tab frame + empty state (spec-b2b §5) — this is the onboarding surface
 * for a fresh partner, since Rezerwacje is the one tab that is always present. The
 * row list below is a minimal stand-in; the full inbox screen (grouping, read/handled
 * state, "Pytanie" tag) is T12.
 */
export default function BookingsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<InboxResponse>("/partner/inbox")
      .then((r) => setItems(flattenInbox(r.data)))
      .catch(() =>
        toast({ description: "Nie udało się załadować rezerwacji.", variant: "destructive" }),
      )
      .finally(() => setIsLoading(false));
  }, [toast]);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Rezerwacje</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="space-y-3">
          <div className="rounded-2xl border bg-white py-10 px-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Inbox size={22} className="text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-gray-900">Tu pojawią się rezerwacje</p>
              <p className="text-sm text-gray-500">
                Zapytania i rezerwacje od uczestników Twoich wyjazdów, wydarzeń i kursów zobaczysz w
                tym miejscu — gdy tylko coś opublikujesz.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 pt-1">
              <Link href="/konto/partner/oferta" className="w-full">
                <Button variant="green" className="w-full rounded-full">
                  Dodaj pierwsze wydarzenie
                </Button>
              </Link>
              <Link
                href="/konto/partner/instruktorzy/create"
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                Utwórz profil instruktora
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3">
            <CalendarPlus size={16} className="mt-0.5 shrink-0 text-gray-400" />
            <p className="text-xs text-gray-500">
              Prowadzisz studio lub zajęcia? Utwórz studio w Menu — wtedy pojawi się tab Grafik.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {items.map((item) => (
            <Link
              key={item.id}
              href={
                item.kind === "question"
                  ? `/konto/partner/wiadomosci/${item.id}`
                  : `/konto/partner/zamowienia/${item.id}`
              }
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.author?.email ?? "Nieznany nadawca"}
                  {item.kind === "question" && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      Pytanie
                    </span>
                  )}
                </p>
                {item.event_title && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{item.event_title}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.created_at)}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

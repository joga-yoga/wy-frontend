"use client";

import { CalendarPlus, ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HashedAvatar } from "@/components/common/HashedAvatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { flattenInbox, InboxResponse, InquiryItem } from "@/lib/inboxTypes";
import { cn } from "@/lib/utils";

const EVENT_TYPE_LABELS: Record<string, string> = {
  retreat: "Wyjazd",
  workshop: "Wydarzenie",
  course: "Kurs",
  class: "Zajęcia",
};

function timeLabel(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

function dayGroupLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Dziś";
  if (sameDay(d, yesterday)) return "Wczoraj";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

/**
 * Rezerwacje tab frame + empty state (spec-b2b §5) — this is the onboarding surface
 * for a fresh partner, since Rezerwacje is the one tab that is always present. Rows
 * reuse the day-grouped/avatar/tag visual language from the approved mockups; the
 * full inbox screen (filter chips, read/handled actions) is T12.
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

  const groups = useMemo(() => {
    const map = new Map<string, InquiryItem[]>();
    for (const item of items) {
      const label = dayGroupLabel(item.created_at);
      const bucket = map.get(label);
      if (bucket) bucket.push(item);
      else map.set(label, [item]);
    }
    return [...map.entries()];
  }, [items]);

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
        <div className="space-y-5">
          {groups.map(([label, groupItems]) => (
            <section key={label} className="space-y-2">
              <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {label}
              </h2>
              <div className="divide-y rounded-xl border bg-white overflow-hidden">
                {groupItems.map((item) => {
                  const displayName = item.author?.email ?? "Nieznany nadawca";
                  const typeLabel = item.event_type ? EVENT_TYPE_LABELS[item.event_type] : null;
                  return (
                    <Link
                      key={item.id}
                      href={
                        item.kind === "question"
                          ? `/konto/partner/wiadomosci/${item.id}`
                          : `/konto/partner/zamowienia/${item.id}`
                      }
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <HashedAvatar
                        seed={item.author?.id ?? item.id}
                        name={displayName}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!item.is_read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green-700" />
                          )}
                          <p
                            className={cn(
                              "truncate text-sm",
                              item.is_read
                                ? "font-medium text-gray-700"
                                : "font-semibold text-gray-900",
                            )}
                          >
                            {displayName}
                          </p>
                        </div>
                        {item.event_title && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {item.event_title}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {typeLabel && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              {typeLabel}
                            </span>
                          )}
                          {item.kind === "question" && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              Pytanie
                            </span>
                          )}
                          {!item.is_read && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-brand-green-700">
                              Nowa
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-gray-400">{timeLabel(item.created_at)}</span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

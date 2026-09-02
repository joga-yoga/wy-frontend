"use client";

import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

import type { MyPassDetailOut, MyPassUsageEntry } from "../../types";
import { PassTicketCard } from "../PassTicketCard";

/**
 * One pass: the card as hero, then where every entry went (WY-71 item 4).
 *
 * The ledger has always existed — `PassUsage` is what `entries_left_for` counts — but nothing
 * ever serialized it, so "7 z 10 zostało" was a number the customer had to take on trust. This
 * is the screen that shows the working.
 */

function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Month-grouped, matching how the B2B visit history reads. Entries whose session is unknown
 *  (a booking whose occurrence is gone) have no month to file under and land in their own
 *  bucket rather than being dropped — the entry was still spent. */
function groupByMonth(usage: MyPassUsageEntry[]): [string, MyPassUsageEntry[]][] {
  const grouped = new Map<string, MyPassUsageEntry[]>();
  for (const entry of usage) {
    const key = entry.starts_at ? entry.starts_at.slice(0, 7) : "unknown";
    const bucket = grouped.get(key);
    if (bucket) bucket.push(entry);
    else grouped.set(key, [entry]);
  }
  return [...grouped.entries()];
}

function PassDetailContent() {
  const params = useParams<{ userPassId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [pass, setPass] = useState<MyPassDetailOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/account/login?next=${encodeURIComponent(`/account/passes/${params.userPassId}`)}`,
      );
    }
  }, [loading, user, router, params.userPassId]);

  useEffect(() => {
    if (!user) return;
    axiosInstance
      .get<MyPassDetailOut>(`/users/me/passes/${params.userPassId}`)
      .then((r) => setPass(r.data))
      .catch(() => setPass(null))
      .finally(() => setIsLoading(false));
  }, [user, params.userPassId]);

  if (loading || !user || isLoading) {
    return (
      <div className="flex min-h-[100dvh] justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const groups = pass ? groupByMonth(pass.usage) : [];

  return (
    <div className="min-h-[100dvh] bg-background pb-10">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background px-4">
        <button
          onClick={() => router.back()}
          aria-label="Wróć"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="truncate text-xl font-bold text-gray-900">Karnet</h1>
      </header>

      {!pass ? (
        <p className="px-4 py-16 text-center text-sm text-gray-400">
          Nie znaleźliśmy tego karnetu.
        </p>
      ) : (
        <div className="mx-auto max-w-md px-4 py-5">
          <PassTicketCard pass={pass} />

          {pass.purchased_at && (
            <p className="mt-3 px-1 text-sm text-gray-500">
              Kupiony{" "}
              {new Date(pass.purchased_at).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {pass.price != null &&
                ` · ${pass.price.toFixed(2).replace(".", ",")} ${pass.currency?.toUpperCase() ?? "PLN"}`}
            </p>
          )}

          <section className="mt-7">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Historia wykorzystania
            </h2>
            {pass.usage.length === 0 ? (
              <p className="mt-3 rounded-b2b border border-dashed bg-white px-4 py-6 text-center text-sm text-gray-500">
                Nie wykorzystano jeszcze żadnego wejścia.
              </p>
            ) : (
              <div className="mt-3 space-y-5">
                {groups.map(([key, entries]) => (
                  <div key={key}>
                    <p className="px-1 text-sm font-semibold text-gray-900 first-letter:uppercase">
                      {key === "unknown" ? "Bez daty" : formatMonth(key)}
                    </p>
                    <div className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-b2b border bg-white">
                      {entries.map((entry) => {
                        const isCancelled = entry.status === "cancelled";
                        return (
                          <div
                            key={entry.booking_id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3",
                              isCancelled && "opacity-60",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "truncate text-sm font-semibold text-gray-900",
                                  isCancelled && "line-through",
                                )}
                              >
                                {entry.session_title ?? "Zajęcia"}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {[
                                  entry.starts_at ? formatDay(entry.starts_at) : null,
                                  entry.studio_name,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                            {isCancelled && <StatusChip tone="gray">Zwrócone</StatusChip>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

/** `useParams` is uncached data; Next 16 will not prerender a route that reads it outside a
 *  Suspense boundary, and `/account/passes` has no layout of its own to supply one. */
export default function PassDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <PassDetailContent />
    </Suspense>
  );
}

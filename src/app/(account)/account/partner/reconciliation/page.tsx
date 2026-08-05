"use client";

import { ChevronRight, Info } from "lucide-react";
import { useEffect, useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { axiosInstance } from "@/lib/axiosInstance";
import { personLabel } from "@/lib/personDisplay";

import { ResolveSheet } from "../studio/[studioId]/front-desk/components/ResolveSheet";
import { fundingDetailLine } from "../studio/[studioId]/front-desk/fundingDetail";
import type { RosterEntry } from "../studio/[studioId]/front-desk/types";

interface ReconciliationSession {
  occurrence_id: string;
  start_time: string;
  class_title: string | null;
  studio_id: string | null;
  studio_name: string | null;
  count: number;
}

interface SessionGroup {
  session: ReconciliationSession;
  rows: RosterEntry[];
}

function formatSessionHeader(session: ReconciliationSession, showStudioLabels: boolean): string {
  const day = new Date(session.start_time).toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = new Date(session.start_time).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = [session.class_title ?? "Zajęcia", `${day}, ${time}`];
  if (showStudioLabels && session.studio_name) parts.push(session.studio_name);
  return parts.join(" · ");
}

/**
 * Reconciliation list (reception-desk §5) — grouped by session, chip + funding +
 * chevron rows only, **no buttons in the list**; tapping opens the exact same
 * resolve sheet the roster screen uses. Rendering this list mutates nothing.
 */
export default function ReconciliationPage() {
  const [groups, setGroups] = useState<SessionGroup[] | null>(null);
  const [showStudioLabels, setShowStudioLabels] = useState(false);
  const [resolveEntry, setResolveEntry] = useState<RosterEntry | null>(null);

  async function load() {
    const { data } = await axiosInstance.get<{
      sessions: ReconciliationSession[];
      show_studio_labels: boolean;
    }>("/partner/reconciliation");
    setShowStudioLabels(data.show_studio_labels);

    const built: SessionGroup[] = await Promise.all(
      data.sessions.map(async (session) => {
        const { data: roster } = await axiosInstance.get<RosterEntry[]>(
          `/occurrences/${session.occurrence_id}/roster`,
        );
        const flagged = roster.filter(
          (e) =>
            e.status !== "no_show" &&
            (e.is_overdue || (e.funding_type === "sport_card" && e.needs_card_check)),
        );
        return { session, rows: flagged };
      }),
    );
    setGroups(built.filter((g) => g.rows.length > 0));
  }

  useEffect(() => {
    load();
  }, []);

  async function resolveWith(action: string) {
    if (!resolveEntry) return;
    await axiosInstance.post(`/bookings/${resolveEntry.booking_id}/${action}`);
    load();
  }

  if (groups === null) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      {groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          Wszystko rozliczone. Świetna robota.
        </p>
      ) : (
        groups.map(({ session, rows }) => (
          <section key={session.occurrence_id} className="space-y-2">
            <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {formatSessionHeader(session, showStudioLabels)}
            </h2>
            <div className="rounded-b2b border bg-white overflow-hidden divide-y">
              {rows.map((entry) => (
                <button
                  key={entry.booking_id}
                  onClick={() => setResolveEntry(entry)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {personLabel(entry.user_name, entry.user_email).primary}
                    </p>
                    {/* Chip then the funding detail, same shape as the roster row — this is the
                     * same person and the same debt, seen from the other entry point. */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusChip tone="amber">
                        {entry.funding_type === "sport_card" && entry.needs_card_check
                          ? "Sprawdź kartę"
                          : `Do zapłaty${entry.amount_owed != null ? ` · ${entry.amount_owed} zł` : ""}`}
                      </StatusChip>
                      {fundingDetailLine(entry) && (
                        <span className="text-xs text-gray-500">{fundingDetailLine(entry)}</span>
                      )}
                    </div>
                  </div>
                  {/* Chevron, never a button: every outcome lives in the one sheet, so this list
                   * stays a list. Future outcomes become sheet rows, not new buttons here. */}
                  <ChevronRight size={16} className="shrink-0 self-center text-gray-300" />
                </button>
              ))}
            </div>
          </section>
        ))
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-gray-400" />
        <p className="text-[13px] leading-snug text-gray-600">
          Przypomnienie, nie automat: system sam niczego nie oznacza. Rozstrzygnięcie zawsze wymaga
          Twojego działania.
        </p>
      </div>

      <ResolveSheet
        entry={resolveEntry}
        open={resolveEntry != null}
        onOpenChange={(open) => !open && setResolveEntry(null)}
        onConfirm={() => resolveWith("confirm")}
        onMarkNoShow={() => resolveWith("mark-no-show")}
        onCorrectNoShow={() => resolveWith("correct-no-show")}
        onDeskCancel={() => resolveWith("desk-cancel")}
      />
    </div>
  );
}

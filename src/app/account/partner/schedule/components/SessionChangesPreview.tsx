"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

import { osoby, plural } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";

import type { NotificationSummary, SessionEditPreviewItem } from "../types";

// Representative-card cap (reception-desk §6 / mockups S6-S7): a 21-session series preview
// shows ~4 example cards, never all 21 — truncation is presentation-only, the preview payload
// underneath is already the complete set.
const MAX_VISIBLE = 4;

interface SessionChangesPreviewProps {
  items: SessionEditPreviewItem[];
  notificationSummary?: NotificationSummary;
}

function extractTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatDatePL(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "long" });
}

const BADGES: Record<string, { label: string; className: string }> = {
  // A modification is neither good news nor a loss, hence an informational blue rather than
  // green or red. Sampled from S5.
  modified: { label: "Zmienione", className: "bg-b2b-blue-bg text-b2b-blue-text" },
  new: { label: "Nowe", className: "bg-b2b-green-bg text-b2b-green-text" },
  cancelled: { label: "Odwołane", className: "bg-b2b-red-bg text-b2b-red-text" },
  deleted: { label: "Usunięte", className: "bg-b2b-red-bg text-b2b-red-text" },
};

function StatusBadge({ status }: { status: string }) {
  const badge = BADGES[status];
  if (!badge) return null;
  return (
    <span
      className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", badge.className)}
    >
      {badge.label}
    </span>
  );
}

/** Gray card with a leading icon — the explanatory note and the notification line (S5–S7). */
export function PreviewNoteCard({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <p className="text-[13px] leading-snug text-gray-600">{children}</p>
    </div>
  );
}

export function SessionChangesPreview({ items, notificationSummary }: SessionChangesPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sorted = [...items].sort(
    (a, b) => new Date(a.calendar_date).getTime() - new Date(b.calendar_date).getTime(),
  );

  if (sorted.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-500">Brak zmian do zastosowania.</p>;
  }

  const isTruncated = !isExpanded && sorted.length > MAX_VISIBLE;
  const visible = isTruncated ? sorted.slice(0, MAX_VISIBLE) : sorted;
  const hiddenCount = sorted.length - visible.length;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {visible.map((item) => {
          const timeStr = extractTime(item.start_time);

          return (
            <div
              key={
                item.occurrence_id ??
                `${item.calendar_date}-${item.status}-${item.start_time ?? ""}`
              }
              // Every item in this payload *is* an affected session, so all cards carry the
              // green outline and the badge says how each will be touched. S6 additionally
              // draws greyed-out "Bez zmian" rows for untouched sessions before the cutoff, but
              // the preview endpoint does not return those — the same reassurance is given in
              // words by the note card the caller renders, rather than by faking rows.
              className="rounded-b2b border border-b2b-green-text/60 bg-white px-4 py-3 ring-1 ring-b2b-green-text/25"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {formatDatePL(item.calendar_date)}
                </p>
                <span className="ml-auto">
                  <StatusBadge status={item.status} />
                </span>
              </div>

              {item.diffs.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {item.diffs.map((d) => (
                    <p key={d.label} className="text-[13px] text-gray-500">
                      {d.label}: <span className="font-semibold text-gray-900">{d.old}</span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="font-semibold text-gray-900">{d.new}</span>
                    </p>
                  ))}
                </div>
              )}

              {item.status === "new" && (
                <p className="mt-1.5 text-[13px] text-gray-500">
                  {[timeStr, item.capacity != null ? `limit ${item.capacity}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              {item.status === "cancelled" && item.booked_count > 0 && (
                <p className="mt-1.5 text-[13px] text-gray-500">
                  {item.booked_count}{" "}
                  {plural(item.booked_count, "rezerwacja", "rezerwacje", "rezerwacji")} · sesja
                  pozostanie widoczna
                </p>
              )}
            </div>
          );
        })}
      </div>

      {isTruncated && (
        <div className="space-y-2">
          <p className="text-center text-[13px] text-gray-400">
            … i {hiddenCount}{" "}
            {plural(hiddenCount, "kolejna sesja", "kolejne sesje", "kolejnych sesji")} wg tego wzoru
          </p>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full rounded-b2b border bg-white py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            Pokaż wszystkie sesje ({sorted.length})
          </button>
        </div>
      )}

      {notificationSummary && (
        <PreviewNoteCard icon={<Bell size={15} />}>
          {notificationSummary.total_recipients > 0
            ? `Powiadomimy ${osoby(notificationSummary.total_recipients)} z zajętych sesji`
            : "Żadne powiadomienia nie zostaną wysłane"}
        </PreviewNoteCard>
      )}
    </div>
  );
}

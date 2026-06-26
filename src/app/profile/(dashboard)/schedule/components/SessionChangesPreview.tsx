"use client";

import { Badge } from "@/components/ui/badge";

import type { NotificationSummary, SessionEditPreviewItem } from "../types";

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
  return d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
}

function statusBadge(status: SessionEditPreviewItem["status"]) {
  switch (status) {
    case "modified":
      return (
        <Badge variant="secondary" className="text-[10px] shrink-0">
          Zmienione
        </Badge>
      );
    case "new":
      return (
        <Badge className="text-[10px] shrink-0 bg-green-100 text-green-700 hover:bg-green-100">
          Nowe
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="destructive" className="text-[10px] shrink-0">
          Odwołane
        </Badge>
      );
    case "deleted":
      return (
        <Badge className="text-[10px] shrink-0 bg-red-100 text-red-700 hover:bg-red-100">
          Usunięte
        </Badge>
      );
    default:
      return null;
  }
}

export function SessionChangesPreview({ items, notificationSummary }: SessionChangesPreviewProps) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.calendar_date).getTime() - new Date(b.calendar_date).getTime(),
  );

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Brak zmian do zastosowania.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Sprawdź co się zmieni przed zapisaniem.</p>

      <div className="space-y-2">
        {sorted.map((item) => {
          const timeStr = extractTime(item.start_time);

          return (
            <div
              key={
                item.occurrence_id ??
                `${item.calendar_date}-${item.status}-${item.start_time ?? ""}`
              }
              className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-white"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDatePL(item.calendar_date)}
                    {timeStr && <span className="text-gray-500 font-normal"> · {timeStr}</span>}
                  </p>
                  {statusBadge(item.status)}
                  {item.booked_count > 0 && (
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      {item.booked_count} os.
                    </span>
                  )}
                </div>

                {item.diffs.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {item.diffs.map((d) => (
                      <p key={d.label} className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{d.label}:</span>{" "}
                        <span className="line-through text-gray-400">{d.old}</span>
                        {" → "}
                        <span className="text-gray-700">{d.new}</span>
                      </p>
                    ))}
                  </div>
                )}

                {item.status === "new" && (
                  <div className="mt-1.5 space-y-0.5">
                    {item.instructor_id && (
                      <p className="text-xs text-gray-400">Prowadzący przypisany</p>
                    )}
                    {item.capacity != null && (
                      <p className="text-xs text-gray-400">Limit: {item.capacity}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {notificationSummary && (
        <p className="text-sm text-gray-500 pt-1">
          {notificationSummary.total_recipients > 0
            ? `Powiadomimy ${notificationSummary.total_recipients} ${notificationSummary.total_recipients === 1 ? "osobę" : "osób"}.`
            : "Żadne powiadomienia nie zostaną wysłane."}
        </p>
      )}
    </div>
  );
}

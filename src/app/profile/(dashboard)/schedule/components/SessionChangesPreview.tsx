"use client";

import { Badge } from "@/components/ui/badge";
import type { SessionDetailResponse, SessionEditPreviewItem } from "../types";

interface InitialValues {
  startTime: string;    // HH:MM
  instructorId: string;
  roomId: string;
  capacityStr: string;
}

interface SessionChangesPreviewProps {
  items: SessionEditPreviewItem[];
  currentOccurrence: SessionDetailResponse | null;
  initialValues?: InitialValues;
  instructors: { id: string; name: string }[];
  rooms: { id: string; name: string }[];
}

interface DiffField {
  label: string;
  oldValue: string;
  newValue: string;
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

function actionBadge(action: string) {
  switch (action) {
    case "update":
      return (
        <Badge variant="secondary" className="text-[10px] shrink-0">
          Zmienione
        </Badge>
      );
    case "create":
      return (
        <Badge className="text-[10px] shrink-0 bg-green-100 text-green-700 hover:bg-green-100">
          Nowe
        </Badge>
      );
    case "cancel":
      return (
        <Badge variant="destructive" className="text-[10px] shrink-0">
          Odwołane
        </Badge>
      );
    case "delete":
      return (
        <Badge className="text-[10px] shrink-0 bg-red-100 text-red-700 hover:bg-red-100">
          Usunięte
        </Badge>
      );
    default:
      return null;
  }
}

function buildDiff(
  item: SessionEditPreviewItem,
  initialValues: InitialValues | undefined,
  instructorMap: Map<string, string>,
  roomMap: Map<string, string>,
): DiffField[] {
  if (item.action !== "update" || !initialValues) return [];

  const diffs: DiffField[] = [];

  // Time
  const newTime = extractTime(item.start_time);
  if (newTime && newTime !== initialValues.startTime) {
    diffs.push({
      label: "Godzina",
      oldValue: initialValues.startTime || "—",
      newValue: newTime,
    });
  }

  // Instructor
  const newInstructorId = item.instructor_id ? String(item.instructor_id) : "";
  if (newInstructorId !== initialValues.instructorId) {
    diffs.push({
      label: "Prowadzący",
      oldValue: initialValues.instructorId
        ? (instructorMap.get(initialValues.instructorId) ?? "Nieznany")
        : "Brak",
      newValue: newInstructorId
        ? (instructorMap.get(newInstructorId) ?? "Nieznany")
        : "Brak",
    });
  }

  // Room
  const newRoomId = item.room_id ? String(item.room_id) : "";
  if (newRoomId !== initialValues.roomId) {
    diffs.push({
      label: "Sala",
      oldValue: initialValues.roomId
        ? (roomMap.get(initialValues.roomId) ?? "Nieznana")
        : "Brak",
      newValue: newRoomId
        ? (roomMap.get(newRoomId) ?? "Nieznana")
        : "Brak",
    });
  }

  // Capacity
  const newCapacity = item.capacity != null ? String(item.capacity) : "";
  if (newCapacity !== initialValues.capacityStr) {
    diffs.push({
      label: "Limit",
      oldValue: initialValues.capacityStr || "Bez limitu",
      newValue: newCapacity || "Bez limitu",
    });
  }

  return diffs;
}

export function SessionChangesPreview({
  items,
  initialValues,
  instructors,
  rooms,
}: SessionChangesPreviewProps) {
  const instructorMap = new Map(instructors.map((i) => [i.id, i.name]));
  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));

  const sorted = [...items].sort(
    (a, b) => new Date(a.calendar_date).getTime() - new Date(b.calendar_date).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">Brak zmian do zastosowania.</p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((item, idx) => {
        const diffs = buildDiff(item, initialValues, instructorMap, roomMap);
        const timeStr = extractTime(item.start_time);

        return (
          <div key={idx} className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-white">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {formatDatePL(item.calendar_date)}
                  {timeStr && (
                    <span className="text-gray-500 font-normal"> · {timeStr}</span>
                  )}
                </p>
                {actionBadge(item.action)}
              </div>
              {diffs.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {diffs.map((d) => (
                    <p key={d.label} className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{d.label}:</span>{" "}
                      <span className="line-through text-gray-400">{d.oldValue}</span>
                      {" → "}
                      <span className="text-gray-700">{d.newValue}</span>
                    </p>
                  ))}
                </div>
              )}
              {item.action === "create" && (
                <div className="mt-1.5 space-y-0.5">
                  {item.instructor_id && instructorMap.has(String(item.instructor_id)) && (
                    <p className="text-xs text-gray-500">
                      Prowadzący: {instructorMap.get(String(item.instructor_id))}
                    </p>
                  )}
                  {item.room_id && roomMap.has(String(item.room_id)) && (
                    <p className="text-xs text-gray-500">
                      Sala: {roomMap.get(String(item.room_id))}
                    </p>
                  )}
                  {item.capacity != null && (
                    <p className="text-xs text-gray-500">Limit: {item.capacity}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { CalendarDays, Layers, RefreshCw, User, Users, X as XIcon } from "lucide-react";
import Link from "next/link";
import { IoPeopleOutline } from "react-icons/io5";

import { DrawerTitle } from "@/components/ui/drawer";
import { osoby } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";

import { recurrenceLabel } from "../recurrenceLabel";
import type { ScheduleOccurrence } from "../types";

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatFullDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** A fact row: icon tile, then the label above its value (S1). */
function FactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] leading-tight text-gray-500">{label}</p>
        <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/** An action row: no border or button chrome, just a full-width row with a hairline
 * between neighbours (S1). */
function ActionRow({
  href,
  icon,
  label,
  tone = "default",
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "green" | "danger";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 py-3.5 text-sm font-medium transition-colors hover:bg-gray-50",
        tone === "green" && "text-b2b-green-text",
        tone === "danger" && "text-b2b-red-solid",
        tone === "default" && "text-gray-900",
      )}
    >
      <span className="flex w-5 shrink-0 justify-center">{icon}</span>
      {label}
    </Link>
  );
}

/**
 * The session panel opened by tapping a Grafik row (mockup S1).
 *
 * Facts first, then the four actions as a hairline-divided row list — not stacked outline
 * buttons, which is how it was drawn before. The three lower actions all feed the same
 * Zakres → Podgląd → Zapis pipeline; only their entry point differs.
 */
export function SessionPanel({
  occ,
  fallbackStudioId,
}: {
  occ: ScheduleOccurrence;
  fallbackStudioId: string | null;
}) {
  const isCancelled = occ.status === "cancelled";
  const recurrence = recurrenceLabel(occ.recurrence_frequency, occ.recurrence_days);
  const rosterStudioId = occ.studio_id ?? fallbackStudioId;

  return (
    <div className="px-4 pb-6">
      <div className="flex items-start justify-between gap-2 pt-2 pb-4">
        <DrawerTitle className="min-w-0 flex-1 text-xl font-bold text-gray-900">
          {occ.template_title}
        </DrawerTitle>
        {/* Only for genuinely recurring sessions — a one-off gets no pill at all.
         * Capped and wrapping rather than `shrink-0`: a long weekday list next to a
         * two-line class title otherwise runs off the edge of the sheet. */}
        {recurrence && !isCancelled && (
          <span className="mt-1 max-w-[45%] rounded-full bg-gray-100 px-2.5 py-1 text-right text-[11px] font-medium leading-tight text-gray-600">
            {recurrence}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <FactRow
          icon={<CalendarDays size={16} />}
          label="Termin"
          value={`${formatFullDay(occ.calendar_date)} · ${formatTime(occ.start_time)}–${formatTime(occ.end_time)}`}
        />
        <FactRow
          icon={<User size={16} />}
          label="Prowadzący · Sala"
          value={[occ.instructor_name, occ.room_name].filter(Boolean).join(" · ") || "—"}
        />
        <FactRow
          icon={<Users size={16} />}
          label="Zapisani"
          value={occ.capacity ? `${occ.fill_count} z ${occ.capacity}` : `${occ.fill_count}`}
        />
      </div>

      {!isCancelled && (
        <div className="mt-5 divide-y divide-gray-100 border-t pt-1">
          {rosterStudioId && (
            <ActionRow
              href={`/konto/partner/studio/${rosterStudioId}/front-desk/${occ.id}`}
              icon={<IoPeopleOutline className="h-[18px] w-[18px]" />}
              label="Lista obecności"
              tone="green"
            />
          )}
          <ActionRow
            href={`/konto/partner/grafik/edit/${occ.id}`}
            icon={<Layers size={17} />}
            label="Edytuj"
          />
          <ActionRow
            href={`/konto/partner/grafik/edit/${occ.id}?field=instructor`}
            icon={<RefreshCw size={17} />}
            label="Zmień prowadzącego"
          />
          <ActionRow
            href={`/konto/partner/grafik/cancel/${occ.id}`}
            icon={<XIcon size={17} />}
            label="Odwołaj sesję"
            tone="danger"
          />
        </div>
      )}

      {/* A cancelled session keeps its notification count — a real field the mockup omits,
       * so it is restyled rather than dropped. */}
      {isCancelled && (
        <div className="mt-5 rounded-xl border border-b2b-red-border bg-b2b-red-bg px-4 py-3">
          <p className="text-sm font-semibold text-b2b-red-text">Sesja odwołana</p>
          {occ.notified_count > 0 && (
            <p className="mt-0.5 text-xs text-b2b-red-text/80">
              Powiadomiliśmy {osoby(occ.notified_count)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

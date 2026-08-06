import { StatusChip } from "@/components/b2b/StatusChip";

export interface ClientVisitLike {
  booking_id: string;
  start_time: string | null;
  class_title: string | null;
  status: string;
  funding: string | null;
}

// Gender-neutral status vocabulary (reception-desk §1.2, system-wide): nouns, not
// adjectives, so a row never has to know who it is describing.
const STATUS: Record<string, { label: string; tone: "green" | "gray" | "rose" }> = {
  booked: { label: "Obecność ✓", tone: "green" },
  attended: { label: "Obecność ✓", tone: "green" },
  no_show: { label: "Nieobecność", tone: "gray" },
  cancelled: { label: "Odwołane przez studio", tone: "rose" },
};

const FUNDING_LABEL: Record<string, string> = {
  drop_in: "wejście jednorazowe",
  use_pass: "Karnet · −1",
  sport_card: "karta sportowa",
  buy_and_use: "kup i użyj karnetu",
  unknown: "",
};

/**
 * One visit (mockup K4).
 *
 * The date moves into a left gutter — day number over month and time — so a month of rows
 * scans down the numbers rather than down repeated prose. The status becomes a chip,
 * matching every other B2B list, and the funding detail sits beside it because "were they
 * here?" and "what did it cost?" get asked together.
 *
 * A cancelled visit says the entry came back. That is the thing a client rings up about,
 * and leaving it to be inferred from a number that isn't there is how disputes start.
 */
export function ClientVisitRow({ visit }: { visit: ClientVisitLike }) {
  const date = visit.start_time ? new Date(visit.start_time) : null;
  const status = STATUS[visit.status] ?? { label: visit.status, tone: "gray" as const };
  const isCancelled = visit.status === "cancelled";
  const funding = visit.funding ? (FUNDING_LABEL[visit.funding] ?? visit.funding) : null;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-11 shrink-0 text-center">
        <div className="text-base font-bold leading-none text-gray-900">
          {date ? date.getDate() : "—"}
        </div>
        {date && (
          <div className="mt-0.5 text-[11px] leading-tight text-gray-400">
            {date.toLocaleDateString("pl-PL", { month: "short" })}
            <br />
            {date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {visit.class_title ?? "Zajęcia"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
          {isCancelled ? (
            <span className="text-xs text-gray-500">wejście zwrócone</span>
          ) : (
            funding && <span className="text-xs text-gray-500">{funding}</span>
          )}
        </div>
      </div>
    </div>
  );
}

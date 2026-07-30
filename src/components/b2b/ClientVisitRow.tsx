export interface ClientVisitLike {
  booking_id: string;
  start_time: string | null;
  class_title: string | null;
  status: string;
  funding: string | null;
}

// Gender-neutral status vocabulary (reception-desk §1.2, system-wide).
const STATUS_LABEL: Record<string, string> = {
  booked: "Obecność ✓",
  attended: "Obecność ✓",
  no_show: "Nieobecność",
  cancelled: "Odwołane przez studio · wejście zwrócone",
};

const FUNDING_LABEL: Record<string, string> = {
  drop_in: "wejście jednorazowe",
  use_pass: "karnet",
  sport_card: "karta sportowa",
  buy_and_use: "kup i użyj karnetu",
  unknown: "",
};

export function ClientVisitRow({ visit }: { visit: ClientVisitLike }) {
  const date = visit.start_time
    ? new Date(visit.start_time).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {visit.class_title ?? "Zajęcia"}
        </p>
        <p className="truncate text-xs text-gray-500">
          {date}
          {visit.funding ? ` · ${FUNDING_LABEL[visit.funding] ?? visit.funding}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-xs text-gray-500">
        {STATUS_LABEL[visit.status] ?? visit.status}
      </span>
    </div>
  );
}

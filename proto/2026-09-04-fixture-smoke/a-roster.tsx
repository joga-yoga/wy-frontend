import { StatusChip } from "@/components/b2b/StatusChip";
import { eveningRoster, occurrences } from "@/fixtures";

// Renders the Wednesday-evening roster from the shared persona fixtures through the product's
// own StatusChip. Proves three things at once: the fixtures are importable client-side, they are
// internally coherent (this roster belongs to that occurrence), and a portable product component
// renders unchanged inside the frame.
export default function Roster() {
  const occ = occurrences.wedEvening;

  return (
    <div className="flex flex-col gap-3 p-4">
      <header>
        <p className="text-h-small text-gray-900">{occ.template_title}</p>
        <p className="text-sm text-gray-500">
          {occ.instructor_name} · {occ.room_name} · {occ.fill_count}/{occ.capacity}
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {eveningRoster.map((r) => (
          <li
            key={r.booking_id}
            className="flex items-center justify-between gap-2 rounded-b2b border border-gray-200 p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {r.user_name ?? r.user_email}
              </p>
              <p className="truncate text-xs text-gray-500">
                {r.pass_name
                  ? `${r.pass_name}${r.pass_entries_left === null ? " · bez limitu" : ` · ${r.pass_entries_left} wejść`}`
                  : (r.sport_card_name ?? "Wejście jednorazowe")}
              </p>
            </div>
            {r.amount_owed ? (
              <StatusChip tone="amber">{r.amount_owed} zł</StatusChip>
            ) : r.needs_card_check ? (
              <StatusChip tone="amber">Karta</StatusChip>
            ) : r.checked_in_at ? (
              <StatusChip tone="green">Obecność ✓</StatusChip>
            ) : (
              <StatusChip tone="gray">Zapisano</StatusChip>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { StatusChip } from "@/components/b2b/StatusChip";
import { clientList } from "@/fixtures";

/**
 * Wariant A — obecny idiom: stan to płaski chip po prawej stronie wiersza.
 *
 * Nazwa prowadzi wiersz, bo listę skanuje się po ludziach. Chip niesie stan, nigdy akcję.
 */
const CHIP = {
  debt: { tone: "amber", label: (a: number | null) => `${a} zł` },
  pass: { tone: "green", label: (_: number | null, e: number | null) => (e === null ? "Karnet" : `Karnet · ${e}`) },
  no_pass: { tone: "gray", label: () => "Bez karnetu" },
  expired: { tone: "rose", label: () => "Karnet wygasł" },
  card: { tone: "gray", label: () => "Karta sportowa" },
} as const;

export default function ChipVariant() {
  return (
    <div className="flex flex-col p-4">
      <p className="mb-3 text-h-small text-gray-900">Klienci</p>
      <ul className="flex flex-col">
        {clientList.map((c) => {
          const cfg = CHIP[c.chip.state];
          return (
            <li
              key={c.user_id}
              className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {c.name ?? c.email}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {c.last_visit
                    ? `Ostatnia wizyta ${new Date(c.last_visit).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`
                    : "Brak wizyt"}
                </p>
              </div>
              <StatusChip tone={cfg.tone}>
                {cfg.label(c.chip.amount_due, c.chip.entries_left)}
              </StatusChip>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

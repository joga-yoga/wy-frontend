import { StatusChip } from "@/components/b2b/StatusChip";
import { clientList } from "@/fixtures";

/**
 * Wariant A — kontrola: wiersz taki, jaki jest dziś. Nazwa, ostatnia wizyta, chip stanu.
 *
 * Żeby zadzwonić do dłużnika, recepcja musi otworzyć wiersz i wyjść do innego ekranu.
 */
export default function ObecnyVariant() {
  return (
    <div className="flex flex-col p-4">
      <p className="mb-3 text-h-small text-gray-900">Klienci</p>
      <ul className="flex flex-col">
        {clientList.map((c) => (
          <li
            key={c.user_id}
            className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{c.name ?? c.email}</p>
              <p className="truncate text-xs text-gray-500">
                {c.last_visit
                  ? `Ostatnia wizyta ${new Date(c.last_visit).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`
                  : "Brak wizyt"}
              </p>
            </div>
            {c.chip.state === "debt" ? (
              <StatusChip tone="amber">{c.chip.amount_due} zł</StatusChip>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

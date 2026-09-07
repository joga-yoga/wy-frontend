import { Mail } from "lucide-react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { clientList } from "@/fixtures";

/**
 * Wariant B — kontakt tylko przy długu.
 *
 * Afordancja kontaktu pojawia się wyłącznie w wierszu z długiem, bo tylko tam recepcja
 * czegoś od klienta chce. Dodanie jej do każdego wiersza to odwrócenie częstotliwości:
 * sześć jednakowych ikon, z których używa się jednej.
 *
 * ZBUDOWANE Z TEGO, CO ISTNIEJE: `email` jest w `ClientListItem`, telefonu tam nie ma.
 * Telefon to ustalenie zapisane w `meta.json` i w §0 specyfikacji, nie pole do wymyślenia.
 */
export default function KontaktVariant() {
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
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`mailto:${c.email}`}
                  aria-label={`Napisz do: ${c.name ?? c.email}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500"
                >
                  <Mail className="h-4 w-4" />
                </a>
                <StatusChip tone="amber">{c.chip.amount_due} zł</StatusChip>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

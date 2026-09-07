import { clientList } from "@/fixtures";

/**
 * Wariant B — kwota do zapłaty prowadzi wiersz, nazwa schodzi na drugi plan.
 *
 * Pomysł: recepcja i tak szuka najpierw długów, więc niech dług będzie treścią główną.
 */
export default function AmountLed() {
  return (
    <div className="flex flex-col p-4">
      <p className="mb-3 text-h-small text-gray-900">Klienci</p>
      <ul className="flex flex-col">
        {clientList.map((c) => (
          <li
            key={c.user_id}
            className="flex items-baseline gap-3 border-b border-gray-100 py-3 last:border-b-0"
          >
            <span
              className={
                c.chip.amount_due
                  ? "w-16 shrink-0 text-right text-base font-bold text-b2b-red-text"
                  : "w-16 shrink-0 text-right text-base font-bold text-gray-300"
              }
            >
              {c.chip.amount_due ? `${c.chip.amount_due} zł` : "—"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-900">{c.name ?? c.email}</p>
              <p className="truncate text-xs text-gray-500">
                {c.chip.state === "pass" && c.chip.entries_left !== null
                  ? `Karnet · ${c.chip.entries_left} wejść`
                  : c.chip.state === "pass"
                    ? "Karnet open"
                    : c.chip.state === "expired"
                      ? `Karnet wygasł ${c.chip.expired_on}`
                      : c.chip.state === "card"
                        ? "Karta sportowa"
                        : "Bez karnetu"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

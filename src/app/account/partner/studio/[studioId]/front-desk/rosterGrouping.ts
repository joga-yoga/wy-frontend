import type { RosterEntry } from "./types";

/**
 * spec §4.1/Decision 2: `Oczekuje` = attendance unresolved **or** money/card still owed — not
 * "attendance unresolved" alone. A `mark_card_ok`-ed surcharged sport-card booking is checked in
 * but still owes its surcharge, so it must stay in `Oczekuje` (and count toward `do rozliczenia`)
 * rather than reading as settled. `needs_settlement` already folds the card-check case in, so
 * this is the one predicate every row, group and counter shares — never re-derive it locally.
 */
export function isPendingEntry(entry: RosterEntry): boolean {
  if (entry.status === "no_show") return false;
  const needsMoney = entry.needs_settlement ?? entry.is_overdue;
  return needsMoney || entry.checked_in_at == null;
}

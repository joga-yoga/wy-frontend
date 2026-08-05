import type { RosterEntry } from "./types";

/**
 * The third line of a Recepcja row — what the booking was funded *with*.
 *
 * The backend sends raw parts (pass name, entries, card name, payment method) and the
 * Polish is composed here, matching how `amount_owed_description` carries
 * `order.item_type` rather than copy. Lives in one module because the roster (T10), the
 * resolve sheet and Do rozliczenia (T12) all render the same line.
 *
 * Returns null when there is nothing meaningful to say, so callers can omit the line
 * rather than render an empty row.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "gotówka",
};

function formatEntriesLeft(entry: RosterEntry): string {
  // A pass with no total is an OPEN pass — it never runs out, so "zostały N" is meaningless.
  if (entry.pass_entries_total == null) return "bez limitu";
  return `zostały ${entry.pass_entries_left ?? 0}`;
}

export function fundingDetailLine(entry: RosterEntry): string | null {
  switch (entry.funding_type) {
    case "use_pass": {
      if (!entry.pass_name) return "Karnet";
      // Once the entry has actually been spent, the debit is the useful fact
      // ("Karnet · –1 wejście" in T1), not the remaining balance.
      const suffix = entry.checked_in_at ? "–1 wejście" : formatEntriesLeft(entry);
      return `${entry.pass_name} · ${suffix}`;
    }
    case "buy_and_use":
      return entry.pass_name ? `kup-i-użyj: ${entry.pass_name}` : "Kup i użyj karnetu";
    case "sport_card": {
      const name = entry.sport_card_name ?? "Karta sportowa";
      // The surcharge is the studio's top-up on a sport-card entry; only worth naming
      // while it is still owed.
      return entry.is_overdue && entry.amount_owed != null
        ? `${name} · dopłata ${entry.amount_owed} zł`
        : name;
    }
    case "drop_in": {
      const method = entry.payment_method
        ? (PAYMENT_METHOD_LABELS[entry.payment_method] ?? entry.payment_method)
        : null;
      return method ? `${method} · drop-in` : "drop-in";
    }
    default:
      return null;
  }
}

/** Weekday codes as the backend sends them (already in calendar order). */
const DAY_LABELS: Record<string, string> = {
  MO: "Pn",
  TU: "Wt",
  WE: "Śr",
  TH: "Cz",
  FR: "Pt",
  SA: "So",
  SU: "Nd",
};

/** "Pn i Pt", "Pn, Śr i Pt" — Polish joins the last item with "i", not a comma. */
function joinDays(codes: string[]): string {
  const labels = codes.map((c) => DAY_LABELS[c] ?? c);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} i ${labels[labels.length - 1]}`;
}

/**
 * The session panel's recurrence pill: "Część serii · co tydzień, Pn i Pt" (S1).
 *
 * Returns null for a one-off session so the caller omits the pill entirely. The panel used to
 * show a bare "Część serii" for every non-cancelled session, which mislabelled one-off
 * sessions — hence null rather than a fallback string.
 */
export function recurrenceLabel(
  frequency: string | null | undefined,
  days: string[] | undefined,
): string | null {
  if (!frequency) return null;
  if (frequency !== "WEEKLY") return "Część serii";

  const codes = days ?? [];
  if (codes.length === 0) return "Część serii · co tydzień";

  // Name the common whole-set patterns instead of enumerating them. Spelling out
  // "Pn, Wt, Śr, Cz, Pt, So i Nd" is longer, harder to read, and overflows the pill.
  const set = new Set(codes);
  const has = (...c: string[]) => c.every((x) => set.has(x));
  if (codes.length === 7) return "Część serii · codziennie";
  if (codes.length === 5 && has("MO", "TU", "WE", "TH", "FR")) {
    return "Część serii · w dni powszednie";
  }
  if (codes.length === 2 && has("SA", "SU")) return "Część serii · w weekendy";

  return `Część serii · co tydzień, ${joinDays(codes)}`;
}

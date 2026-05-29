export const PL_DAYS = ["NDZ", "PON", "WT", "ŚR", "CZW", "PT", "SOB"] as const;
export const PL_MONTHS = [
  "sty",
  "lut",
  "mar",
  "kwi",
  "maj",
  "cze",
  "lip",
  "sie",
  "wrz",
  "paź",
  "lis",
  "gru",
] as const;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getDayAbbr(dateStr: string): string {
  return PL_DAYS[new Date(dateStr).getDay()];
}

export function getDayNum(dateStr: string): number {
  return new Date(dateStr).getDate();
}

export function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return `${PL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateRange(startStr: string, endStr: string): string {
  const s = new Date(startStr);
  const e = new Date(endStr);
  const sd = s.getDate();
  const ed = e.getDate();
  const sm = PL_MONTHS[s.getMonth()];
  const em = PL_MONTHS[e.getMonth()];
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${sd}–${ed} ${sm}`;
  }
  return `${sd} ${sm} – ${ed} ${em}`;
}

export function formatTime(dateStr: string): string | null {
  if (!dateStr.includes("T")) return null;
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDuration(startStr: string, endStr: string): string {
  const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 1) return `${diffDays}d`;
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) return `${Math.round(diffHours * 60)} min`;
  return Number.isInteger(diffHours) ? `${diffHours}h` : `${diffHours.toFixed(1)}h`;
}

export function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Bezpłatne";
  return `${price} ${currency.toUpperCase()}`;
}

export function isMultiDay(startStr: string, endStr: string): boolean {
  return new Date(startStr).toDateString() !== new Date(endStr).toDateString();
}

export function countLastYear(events: Array<{ end_date: string }>): number {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return events.filter((e) => new Date(e.end_date) >= cutoff).length;
}

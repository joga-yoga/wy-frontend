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

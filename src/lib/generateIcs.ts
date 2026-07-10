function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export interface IcsEvent {
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string | null;
}

export function buildIcs(event: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//wy//booking//PL",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.startTime)}`,
    `DTEND:${toIcsDate(event.endTime)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

/** Triggers a client-side `.ics` download via a `data:` URI — no backend round-trip needed. */
export function downloadIcs(event: IcsEvent, filename = "zajecia.ics") {
  const ics = buildIcs(event);
  const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  const link = document.createElement("a");
  link.href = dataUri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

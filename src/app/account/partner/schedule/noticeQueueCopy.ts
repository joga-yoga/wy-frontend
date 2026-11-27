import { plural } from "@/lib/polishPlural";

export function noticeQueueCopy(expected?: number | null, queued?: number): string {
  if (expected === 0) return "Nie było zapisanych uczestników.";
  if (queued === undefined) return "Brak danych o kolejce powiadomień.";
  const queuedCopy = `W kolejce są powiadomienia dla ${queued} ${plural(queued, "osoby", "osób", "osób")}.`;
  if (expected == null || expected === queued) return queuedCopy;
  return `${queuedCopy} Liczba zapisanych uczestników objętych zmianą: ${expected}.`;
}

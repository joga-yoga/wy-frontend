import {
  clearPendingEventImport,
  isValidEventSourceUrl,
  readPendingEventImport,
  savePendingEventImport,
} from "@/lib/pendingEventImport";

export function isValidRetreatSourceUrl(value: string): boolean {
  return isValidEventSourceUrl(value);
}

export function savePendingRetreatImport(value: string): void {
  savePendingEventImport("retreat", value);
}

export function readPendingRetreatImport(): string | null {
  return readPendingEventImport("retreat");
}

export function clearPendingRetreatImport(): void {
  clearPendingEventImport("retreat");
}

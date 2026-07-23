const PENDING_RETREAT_IMPORT_KEY = "wy_pending_retreat_import";
const PENDING_RETREAT_IMPORT_TTL_MS = 24 * 60 * 60 * 1000;

type PendingRetreatImport = {
  url: string;
  savedAt: number;
};

export function isValidRetreatSourceUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function savePendingRetreatImport(value: string): void {
  if (typeof window === "undefined") return;

  const pendingImport: PendingRetreatImport = {
    url: value.trim(),
    savedAt: Date.now(),
  };

  window.localStorage.setItem(PENDING_RETREAT_IMPORT_KEY, JSON.stringify(pendingImport));
}

export function readPendingRetreatImport(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(PENDING_RETREAT_IMPORT_KEY);
    if (!rawValue) return null;

    const pendingImport = JSON.parse(rawValue) as Partial<PendingRetreatImport>;
    const isExpired =
      typeof pendingImport.savedAt !== "number" ||
      Date.now() - pendingImport.savedAt > PENDING_RETREAT_IMPORT_TTL_MS;

    if (
      isExpired ||
      typeof pendingImport.url !== "string" ||
      !isValidRetreatSourceUrl(pendingImport.url)
    ) {
      clearPendingRetreatImport();
      return null;
    }

    return pendingImport.url;
  } catch {
    clearPendingRetreatImport();
    return null;
  }
}

export function clearPendingRetreatImport(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_RETREAT_IMPORT_KEY);
}

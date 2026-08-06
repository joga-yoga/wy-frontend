const PENDING_EVENT_IMPORT_TTL_MS = 24 * 60 * 60 * 1000;

const PENDING_EVENT_IMPORT_KEYS = {
  retreat: "wy_pending_retreat_import",
  workshop: "wy_pending_workshop_import",
} as const;

export type PendingEventImportKind = keyof typeof PENDING_EVENT_IMPORT_KEYS;

type PendingEventImport = {
  url: string;
  savedAt: number;
};

export function isValidEventSourceUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function savePendingEventImport(kind: PendingEventImportKind, value: string): void {
  if (typeof window === "undefined") return;

  const pendingImport: PendingEventImport = {
    url: value.trim(),
    savedAt: Date.now(),
  };

  window.localStorage.setItem(PENDING_EVENT_IMPORT_KEYS[kind], JSON.stringify(pendingImport));
}

export function readPendingEventImport(kind: PendingEventImportKind): string | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(PENDING_EVENT_IMPORT_KEYS[kind]);
    if (!rawValue) return null;

    const pendingImport = JSON.parse(rawValue) as Partial<PendingEventImport>;
    const isExpired =
      typeof pendingImport.savedAt !== "number" ||
      Date.now() - pendingImport.savedAt > PENDING_EVENT_IMPORT_TTL_MS;

    if (
      isExpired ||
      typeof pendingImport.url !== "string" ||
      !isValidEventSourceUrl(pendingImport.url)
    ) {
      clearPendingEventImport(kind);
      return null;
    }

    return pendingImport.url;
  } catch {
    clearPendingEventImport(kind);
    return null;
  }
}

export function clearPendingEventImport(kind: PendingEventImportKind): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_EVENT_IMPORT_KEYS[kind]);
}

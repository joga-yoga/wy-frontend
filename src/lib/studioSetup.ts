import type { StudioFormValues } from "@/app/account/partner/studio/[studioId]/edit/types";
import type { StudioIdentity } from "@/components/studio-cta/StudioDiscovery";

export type SetupSession = {
  operationKey: string;
  studioId?: string;
  values?: StudioFormValues;
  identity?: StudioIdentity;
  duplicateAck?: string;
  city?: string;
  dirtyFields?: (keyof StudioFormValues)[];
};

function storageKey(key: string, ownerId: string) {
  return `studio-setup:${encodeURIComponent(ownerId)}:${encodeURIComponent(key)}`;
}
export function readSetup(key: string, ownerId: string): SetupSession | null {
  if (!key || !ownerId) return null;
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey(key, ownerId)) ?? "null");
    return saved &&
      typeof saved === "object" &&
      "operationKey" in saved &&
      typeof saved.operationKey === "string"
      ? (saved as SetupSession)
      : null;
  } catch {
    return null;
  }
}
export function writeSetup(key: string, value: SetupSession, ownerId: string) {
  if (!key || !ownerId) return;
  try {
    // Only this form's non-secret state belongs here; importer credentials never do.
    const { operationKey, studioId, values, identity, duplicateAck, city, dirtyFields } = value;
    sessionStorage.setItem(
      storageKey(key, ownerId),
      JSON.stringify({ operationKey, studioId, values, identity, duplicateAck, city, dirtyFields }),
    );
  } catch {
    /* The mounted form remains usable when storage is unavailable. */
  }
}
export function removeSetup(key: string, ownerId: string) {
  try {
    sessionStorage.removeItem(storageKey(key, ownerId));
  } catch {
    /* Optional storage. */
  }
}

/** A late source response can only supply fields the user has never touched. */
export function untouchedDraftValues(
  incoming: Partial<StudioFormValues>,
  touched: Iterable<keyof StudioFormValues>,
  activeField?: string | null,
): Partial<StudioFormValues> {
  const protectedFields = new Set<string>(touched);
  if (activeField) protectedFields.add(activeField);
  if (
    protectedFields.has("location") ||
    protectedFields.has("location_id") ||
    protectedFields.has("address")
  ) {
    ["location", "location_id", "address"].forEach((field) => protectedFields.add(field));
  }
  return Object.fromEntries(Object.entries(incoming).filter(([key]) => !protectedFields.has(key)));
}

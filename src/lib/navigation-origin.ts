export const NAVIGATION_ORIGIN_STORAGE_KEY = "detail-navigation-origin";

export type NavigationOriginRecord = {
  target: string;
  origin: string;
};

function isInternalPath(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
}

export function parseNavigationOrigin(
  value: string | null,
  currentPath: string,
): NavigationOriginRecord | null {
  if (!value) return null;

  try {
    const record: unknown = JSON.parse(value);
    if (
      typeof record !== "object" ||
      record === null ||
      !("target" in record) ||
      !("origin" in record) ||
      !isInternalPath(record.target) ||
      !isInternalPath(record.origin) ||
      record.target !== currentPath
    ) {
      return null;
    }

    return { target: record.target, origin: record.origin };
  } catch {
    return null;
  }
}

export function readNavigationOrigin(currentPath: string): NavigationOriginRecord | null {
  try {
    return parseNavigationOrigin(
      sessionStorage.getItem(NAVIGATION_ORIGIN_STORAGE_KEY),
      currentPath,
    );
  } catch {
    return null;
  }
}

export function writeNavigationOrigin(target: string, origin: string): void {
  if (!isInternalPath(target) || !isInternalPath(origin)) return;

  try {
    sessionStorage.setItem(
      NAVIGATION_ORIGIN_STORAGE_KEY,
      JSON.stringify({ target, origin } satisfies NavigationOriginRecord),
    );
  } catch {
    // Storage can be unavailable (for example in privacy modes); the header keeps its logo.
  }
}

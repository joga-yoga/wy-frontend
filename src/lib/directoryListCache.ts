type BackgroundTask = (task: Promise<unknown>) => void;

/** One fetch per process. Cold callers wait; warm callers use the last successful list
 * while Proxy's waitUntil keeps a refresh alive after the response. */
export function cachedDirectoryList(
  loadKeys: () => Promise<string[] | null>,
  { ttlMs = 5 * 60 * 1000, now = Date.now } = {},
) {
  let cached: { keys: Set<string>; fetchedAt: number } | null = null;
  let inFlight: Promise<Set<string> | null> | null = null;

  function refresh(): Promise<Set<string> | null> {
    if (!inFlight) {
      inFlight = Promise.resolve()
        .then(loadKeys)
        .then((keys) => {
          if (keys !== null) cached = { keys: new Set(keys), fetchedAt: now() };
          return cached?.keys ?? null;
        })
        .catch(() => cached?.keys ?? null)
        .finally(() => {
          inFlight = null;
        });
    }
    return inFlight;
  }

  return async function keys(waitUntil: BackgroundTask): Promise<Set<string> | null> {
    if (!cached) return refresh();
    if (now() - cached.fetchedAt >= ttlMs) waitUntil(refresh());
    return cached.keys;
  };
}

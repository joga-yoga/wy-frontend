/**
 * B2C/B2B mode is always derived from the route (`/account/partner` prefix = B2B) —
 * there is no hidden mode state (spec-b2b §2). This is only "last used mode per
 * device" memory for the one place that needs a default with no route context yet:
 * where a freshly-authenticated user with no explicit `next` target lands. Every
 * other link (deep links, notifications) already carries its own context and must
 * never consult this — that's what "deep-link context always wins" means in practice.
 */
const LAST_MODE_KEY = "wy_last_mode";

export type AppMode = "b2b" | "b2c";

export function getLastMode(): AppMode {
  if (typeof window === "undefined") return "b2b";
  return localStorage.getItem(LAST_MODE_KEY) === "b2c" ? "b2c" : "b2b";
}

/**
 * Like `getLastMode`, but distinguishes "never recorded" from "recorded as B2B".
 *
 * The difference matters for a device that has *only* ever browsed public pages:
 * `SetLastMode` runs on `/account`, not on the public routes, so such a visitor has no
 * entry at all. Collapsing that into "b2b" is what used to send a first-time B2C visitor
 * arriving from the public header into the partner panel. A partner's device, by
 * contrast, has "b2b" written explicitly by the partner layout, so their memory survives.
 */
export function getRecordedMode(): AppMode | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LAST_MODE_KEY);
  return stored === "b2c" || stored === "b2b" ? stored : null;
}

export function setLastMode(mode: AppMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_MODE_KEY, mode);
}

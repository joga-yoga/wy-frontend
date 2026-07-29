/**
 * B2C/B2B mode is always derived from the route (`/konto/partner` prefix = B2B) —
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

export function setLastMode(mode: AppMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_MODE_KEY, mode);
}

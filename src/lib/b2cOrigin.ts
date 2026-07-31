/**
 * Where the user entered B2C from, so closing it returns them there.
 *
 * The reported bug: a partner switches B2B → B2C, taps "Znajdź studio" or any public
 * link, comes back, and closing the profile drops them on the public website instead of
 * the panel. `router.back()` cannot fix that — by then the history entry behind B2C is a
 * public page, which is exactly where the user does *not* want to be.
 *
 * So the origin is recorded explicitly rather than inferred from history. The B2B switch
 * link carries `?from=b2b`; arriving with it writes a flag that survives navigation
 * within B2C, and closing consumes it. Entering `/konto` from the public header sets
 * nothing, so that route still closes back to the public site — which is correct there.
 *
 * `sessionStorage`, not `localStorage`: this is one visit's context, and a flag that
 * outlived the tab would send someone back to the panel days later for no reason.
 */
const B2C_ORIGIN_KEY = "wy_b2c_origin";

export function rememberB2COrigin(from: string | null): void {
  if (typeof window === "undefined") return;
  if (from === "b2b") sessionStorage.setItem(B2C_ORIGIN_KEY, "b2b");
}

export function cameFromB2B(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(B2C_ORIGIN_KEY) === "b2b";
}

/** Called when the user actually returns to B2B, so a later public entry closes publicly. */
export function clearB2COrigin(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(B2C_ORIGIN_KEY);
}

/**
 * The last public page the user was on, so closing the B2C profile puts them back there.
 *
 * The rule (user's words): *"Clicking on 'X' in header on /konto page must ALWAYS return
 * user to public side of our app. If there is no any persisted state — we must fallback to
 * root page joga.yoga/, if user come to profile from specific public page … we must return
 * user to this page"*.
 *
 * This replaces an earlier `?from=b2b` flag that sent close back to the partner panel.
 * That was wrong in the way that matters: it left a partner with no route to the public
 * site at all. Returning to the panel is what the pinned "Przełącz na konto partnera"
 * button is for, and it is always on screen.
 *
 * Why record rather than use `router.back()`: by the time someone has opened the profile,
 * looked at a pass and closed it, the history entry behind them may be another account
 * screen or an auth bounce. The last *public* URL is the thing we actually want, and only
 * an explicit record survives that.
 */
const PUBLIC_RETURN_KEY = "wy_public_return";

/**
 * Everything under `/konto` is the account app — profile, partner panel, auth. Recording
 * any of it would make the close button a no-op that returns to itself.
 */
export function isPublicPath(pathname: string): boolean {
  return !pathname.startsWith("/konto");
}

export function rememberPublicPath(pathname: string, search = ""): void {
  if (typeof window === "undefined") return;
  if (!isPublicPath(pathname)) return;
  sessionStorage.setItem(PUBLIC_RETURN_KEY, `${pathname}${search}`);
}

/** The page to close to. Falls back to the site root, never to the panel. */
export function publicReturnHref(): string {
  if (typeof window === "undefined") return "/";
  const stored = sessionStorage.getItem(PUBLIC_RETURN_KEY);
  // Guard against a stale value written before this rule existed, or hand-edited storage:
  // an account path here would defeat the whole point.
  if (!stored || !stored.startsWith("/") || !isPublicPath(stored)) return "/";
  return stored;
}

/**
 * What `src/proxy.ts` does with a path — as a pure function, so it can be tested without a
 * server. The proxy supplies the two lists; this decides.
 *
 * The directory's URL shape (`lib/directoryPaths.ts`):
 *
 *   /krakow                 → 302 to /krakow/studia (the future city hub; temporary on purpose)
 *   /krakow/studia          → rewrite to the `[miasto]/studios` folder, if the city has a page
 *   /krakow/studia/hatha    → rewrite to `[miasto]/studios/[style]`, if that style page exists
 *   /studia/hatha           → pass, if the national hub exists
 *   any other path under a segment that is not a real route → 404
 *
 * ⚠ **Why the proxy decides, not the pages.** Under Cache Components the public layout's
 * Suspense boundary means a page's `notFound()` lands mid-stream, after `200 OK` has gone out —
 * a soft 404, measured on a production build. The proxy runs before the router and can answer
 * with a real status. The lists are the same ones the sitemap reads, so the proxy, the pages and
 * the sitemap cannot disagree about which URLs exist.
 *
 * ⚠ **Why the proxy rewrites `studia` → `studios`, not `next.config`.** A config rewrite on
 * `/:city/studia` would also catch `/wydarzenia/studia` (a workshop slugged "studia"). Only the
 * proxy knows which first segments are cities.
 */

/** Every first URL segment the site answers on other than a city. A new top-level route must be
 *  added here, or it 404s in production while working in local development.
 *  `wy-backend/tests/test_directory_city_slugs.py` guards the other direction. */
export const KNOWN_ROOT_SEGMENTS = new Set([
  // public, Polish
  "studia",
  "studio",
  "instruktor",
  "instruktorzy",
  "wydarzenia",
  "wyjazdy",
  "zajecia",
  "kursy",
  "konto",
  "platnosc",
  // public, English folders and legacy paths still redirecting
  "studios",
  "instructor",
  "instructors",
  "workshops",
  "retreats",
  "classes",
  "courses",
  "partner",
  "partners",
  "organizer",
  "profile",
  "book",
  "account",
  // info
  "contact",
  "policy",
  "terms",
  "delete-account",
  // infrastructure
  "api",
  "proto",
]);

/** Segments under `/studia/` that are routes of their own, not styles. Mirrors the backend's
 *  `RESERVED_STUDIA_SEGMENTS` (`services/style_pages.py`), which keeps a style slug from ever
 *  taking one of these names. A new route under `/studia/` belongs in both. */
export const STUDIA_ROUTES = new Set(["przejmij", "usun-dane"]);

/** The public segment under a city, and the English folder it maps to. */
const CITY_STUDIOS_SEGMENT = "studia";
const CITY_STUDIOS_FOLDER = "studios";

export type RouteDecision =
  | { kind: "next" }
  | { kind: "notFound" }
  | { kind: "redirect"; to: string }
  | { kind: "rewrite"; to: string };

/** A list from the directory API, or `null` when it could not be fetched. */
type Lookup = () => Promise<Set<string> | null>;

export interface DirectoryLists {
  /** City slugs that have a page. */
  cities: Lookup;
  /** `"krakow/hatha"` for a city style page, `"/hatha"` for a national hub. */
  stylePages: Lookup;
}

/** An unavailable list lets the request through: a soft 404 is bad, but 404ing every page
 *  because the API blinked is worse. */
async function has(list: Lookup, key: string): Promise<boolean> {
  const keys = await list();
  return keys === null || keys.has(key);
}

const NEXT: RouteDecision = { kind: "next" };
const NOT_FOUND: RouteDecision = { kind: "notFound" };

export async function decideRoute(pathname: string, lists: DirectoryLists): Promise<RouteDecision> {
  const path = pathname.replace(/^\/+|\/+$/g, "");
  // The home page, and anything with a dot — a file.
  if (!path || path.includes(".")) return NEXT;

  const [first, ...rest] = path.split("/");

  if (KNOWN_ROOT_SEGMENTS.has(first)) {
    // `/studia/{styl}` — a national style hub (and its English folder, `/studios/{styl}`).
    if ((first === "studia" || first === "studios") && rest.length === 1) {
      const [style] = rest;
      if (STUDIA_ROUTES.has(style)) return NEXT;
      return (await has(lists.stylePages, `/${style}`)) ? NEXT : NOT_FOUND;
    }
    return NEXT;
  }

  // From here the first segment can only be a city.

  // `/krakow` — no page yet; the city hub comes later. 302, not 301: a permanent redirect
  // would tell search engines the URL is gone for good, and it is not.
  if (rest.length === 0) {
    return (await has(lists.cities, first))
      ? { kind: "redirect", to: `/${first}/${CITY_STUDIOS_SEGMENT}` }
      : NOT_FOUND;
  }

  if (rest[0] !== CITY_STUDIOS_SEGMENT) return NOT_FOUND;

  // `/krakow/studia`
  if (rest.length === 1) {
    return (await has(lists.cities, first))
      ? { kind: "rewrite", to: `/${first}/${CITY_STUDIOS_FOLDER}` }
      : NOT_FOUND;
  }

  // `/krakow/studia/hatha`
  if (rest.length === 2) {
    const style = rest[1];
    return (await has(lists.stylePages, `${first}/${style}`))
      ? { kind: "rewrite", to: `/${first}/${CITY_STUDIOS_FOLDER}/${style}` }
      : NOT_FOUND;
  }

  return NOT_FOUND;
}

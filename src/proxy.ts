import { NextRequest, NextResponse } from "next/server";

/**
 * A genuine 404 for a root segment that is not a city.
 *
 * Named `proxy` in `src/proxy.ts`: Next 16 renamed the `middleware` convention, and the
 * old name builds with a deprecation warning rather than an error, so it is easy to miss.
 *
 * ⚠ **Why this exists rather than `notFound()` in the page.** `/[miasto]` is a dynamic
 * segment at the root of the domain, so it matches *every* unknown single-segment URL —
 * `/jakis-losowy-segment` included. Before it existed those were unmatched routes and the
 * router 404'd them; now they reach a page, and a page cannot reliably answer with a 404
 * status here: under `cacheComponents` the response goes out before `notFound()` is
 * reached, so the body says 404 and the status says 200. Measured on a production build,
 * not assumed.
 *
 * A soft 404 at the root is precisely what a domain recovering from consolidation cannot
 * afford — it is how an unbounded namespace of empty pages gets indexed. Middleware runs
 * before the router, so it can answer with a real status.
 *
 * ⚠ **Standing cost.** Every new top-level route has to be added to `KNOWN_ROOT_SEGMENTS`
 * below, or it will 404 in production while working perfectly in local development. `wy-backend/tests/test_directory_city_slugs.py` guards the
 * other direction — a city slug that collides with a real route.
 *
 * Note this does **not** fix the app-wide soft-404 on `/studio/{slug}`, `/instruktor/{slug}`
 * and the other detail routes, which return 200 for a missing resource and did so before
 * this feature. That is a real problem and a separate one.
 */
const KNOWN_ROOT_SEGMENTS = new Set([
  // public, Polish
  "studia",
  "studio",
  "instruktor",
  "instruktorzy",
  "wydarzenia",
  "wyjazdy",
  "zajecia",
  "kursy",
  "system-dla-studiow-jogi",
  "cennik",
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

/** The city list, refreshed lazily. A stale list can only cause a 404 for a city that has
 *  just joined, which resolves itself within the TTL — the opposite mistake, serving an
 *  empty page for a city that does not qualify, is the one worth avoiding. */
let cachedCities: { slugs: Set<string>; fetchedAt: number } | null = null;
const CITY_CACHE_MS = 5 * 60 * 1000;

async function citySlugs(): Promise<Set<string> | null> {
  if (cachedCities && Date.now() - cachedCities.fetchedAt < CITY_CACHE_MS) {
    return cachedCities.slugs;
  }

  const apiUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!apiUrl) return null;

  try {
    const response = await fetch(`${apiUrl}/directory/cities`);
    if (!response.ok) return cachedCities?.slugs ?? null;
    const cities: { slug: string }[] = await response.json();
    cachedCities = { slugs: new Set(cities.map((c) => c.slug)), fetchedAt: Date.now() };
    return cachedCities.slugs;
  } catch {
    // A directory outage must not start 404ing city pages that exist. Fall through to the
    // last known list, or to letting the request pass.
    return cachedCities?.slugs ?? null;
  }
}

export async function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.slice(1);

  // Only single-segment root paths reach the city route. Anything with a slash or a dot is
  // another route or a file.
  if (!segment || segment.includes("/") || segment.includes(".")) {
    return NextResponse.next();
  }
  if (KNOWN_ROOT_SEGMENTS.has(segment)) {
    return NextResponse.next();
  }

  const slugs = await citySlugs();
  // If the list is unavailable, let the request through: a soft 404 is bad, but 404ing
  // every city page because the API blinked is worse.
  if (slugs === null || slugs.has(segment)) {
    return NextResponse.next();
  }

  return new NextResponse(null, { status: 404 });
}

export const config = {
  // Root single-segment paths only. Everything nested, and every static asset, is skipped
  // before the function runs rather than inside it.
  matcher: ["/((?!_next|api|.*\\.).*)"],
};

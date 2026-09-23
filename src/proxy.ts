import { NextRequest, NextResponse } from "next/server";

import { decideRoute } from "@/lib/directoryRouting";
import { getStyleCopy } from "@/lib/yogaStyleCopy";

/**
 * The directory's routing: real 404s, the `/krakow` → `/krakow/studia` redirect, and the Polish
 * `studia` segment mapped onto the English `[miasto]/studios` folders. The decisions — and why
 * they live here rather than in the pages — are in `lib/directoryRouting.ts`, tested in
 * `lib/directoryRouting.test.ts`. This file only fetches the lists and turns a decision into a
 * response.
 *
 * Named `proxy` in `src/proxy.ts`: Next 16 renamed the `middleware` convention, and the old
 * name builds with a deprecation warning rather than an error, so it is easy to miss.
 *
 * Note this does **not** fix the app-wide soft-404 on `/studio/{slug}`, `/instruktor/{slug}`
 * and the other detail routes, which return 200 for a missing resource and did so before the
 * directory existed. That is a real problem and a separate one.
 */

/** A list from the directory API, refreshed lazily. A stale list can only cause a 404 for a
 *  page that has just appeared, which resolves itself within the TTL — the opposite mistake,
 *  serving an empty page that does not qualify, is the one worth avoiding. */
const LIST_CACHE_MS = 5 * 60 * 1000;

function cachedList(path: string, toKeys: (body: unknown) => string[]) {
  let cached: { keys: Set<string>; fetchedAt: number } | null = null;

  return async function keys(): Promise<Set<string> | null> {
    if (cached && Date.now() - cached.fetchedAt < LIST_CACHE_MS) return cached.keys;

    const apiUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
    if (!apiUrl) return null;

    try {
      const response = await fetch(`${apiUrl}${path}`);
      if (!response.ok) return cached?.keys ?? null;
      cached = { keys: new Set(toKeys(await response.json())), fetchedAt: Date.now() };
      return cached.keys;
    } catch {
      // A directory outage must not start 404ing pages that exist. Fall through to the last
      // known list, or to letting the request pass.
      return cached?.keys ?? null;
    }
  };
}

const lists = {
  cities: cachedList("/directory/cities", (body) =>
    (body as { slug: string }[]).map((city) => city.slug),
  ),
  // A gated style with no text in `yogaStyleCopy.ts` is left out: its page refuses to render.
  stylePages: cachedList("/directory/style-pages", (body) =>
    (body as { city_slug: string | null; style_slug: string }[])
      .filter((page) => getStyleCopy(page.style_slug))
      .map((page) => `${page.city_slug ?? ""}/${page.style_slug}`),
  ),
};

export async function proxy(request: NextRequest) {
  const decision = await decideRoute(request.nextUrl.pathname, lists);

  switch (decision.kind) {
    case "notFound":
      return new NextResponse(null, { status: 404 });
    case "redirect": {
      const url = request.nextUrl.clone();
      url.pathname = decision.to;
      return NextResponse.redirect(url, 302);
    }
    case "rewrite": {
      const url = request.nextUrl.clone();
      url.pathname = decision.to;
      return NextResponse.rewrite(url);
    }
    default:
      return NextResponse.next();
  }
}

export const config = {
  // Everything except Next internals, API routes and files.
  matcher: ["/((?!_next|api|.*\\.).*)"],
};

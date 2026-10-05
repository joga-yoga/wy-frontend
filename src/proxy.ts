import type { NextFetchEvent } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { cachedDirectoryList } from "@/lib/directoryListCache";
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

function cachedList(path: string, toKeys: (body: unknown) => string[]) {
  return cachedDirectoryList(async () => {
    const apiUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
    if (!apiUrl) return null;

    const response = await fetch(`${apiUrl}${path}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    return toKeys(await response.json());
  });
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

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const waitUntil = (task: Promise<unknown>) => event.waitUntil(task);
  const decision = await decideRoute(request.nextUrl.pathname, {
    cities: () => lists.cities(waitUntil),
    stylePages: () => lists.stylePages(waitUntil),
  });

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

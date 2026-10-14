import type { NextFetchEvent } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { BLOG_MIRROR_HEADER, isBlogMirrorHost, mirrorBlogRoute } from "@/app/(public)/blog/mirror";
import { parseBlogPage } from "@/app/(public)/blog/pagination";
import { blogProblemResponse } from "@/app/(public)/blog/problem-response";
import { blogRouteStatus } from "@/app/(public)/blog/routing";
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

// Normalize pagination using the URL only. No index API probes run in the proxy.
function blogIndexResponse(request: NextRequest, mirror: boolean): NextResponse | null {
  const values = request.nextUrl.searchParams.getAll("page");
  const page = parseBlogPage(values.length > 1 ? values : values[0]);
  if (page === null) return blogProblemResponse(404, mirror ? "/" : "/blog");
  if (values.length && (page === 1 || values[0] !== String(page))) {
    const url = request.nextUrl.clone();
    if (page === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(page));
    return NextResponse.redirect(url, 308);
  }
  return null;
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const requestHeaders = new Headers(request.headers);
  // Derive this only from the incoming host; never trust a client-supplied flag.
  requestHeaders.delete(BLOG_MIRROR_HEADER);
  if (isBlogMirrorHost(request.headers.get("host"))) {
    const pathname = mirrorBlogRoute(request.nextUrl.pathname);
    if (pathname === 404) return blogProblemResponse(404, "/");
    if (!pathname) return NextResponse.next();
    if (pathname === "/blog") {
      const response = blogIndexResponse(request, true);
      if (response) return response;
    }
    const status = await blogRouteStatus(pathname);
    if (status) return blogProblemResponse(status, "/");
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    // Next can replace Host with the rewrite target's host while routing locally.
    requestHeaders.set(BLOG_MIRROR_HEADER, "1");
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  if (request.nextUrl.pathname === "/blog") {
    const response = blogIndexResponse(request, false);
    if (response) return response;
  }
  const blogStatus = await blogRouteStatus(request.nextUrl.pathname);
  if (blogStatus) return blogProblemResponse(blogStatus);
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
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
    default:
      return NextResponse.next({ request: { headers: requestHeaders } });
  }
}

export const config = {
  // Also check dotted article slugs so unknown blog URLs receive real 404s.
  matcher: [
    "/blog/:path*",
    "/((?!_next|api|.*\\.).*)",
    { source: "/:path*", has: [{ type: "host", value: "wiedza.joga.yoga" }] },
  ],
};

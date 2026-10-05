import { getPublishedArticle, getPublishedArticles } from "./api";

// Resolve status before the public layout's Suspense boundary starts streaming.
// Reads are deliberately fresh: new publications, updates and outages must be visible.
export async function blogRouteStatus(pathname: string): Promise<404 | 503 | null> {
  if (pathname.startsWith("/blog/problem/")) return 404;
  if (pathname !== "/blog" && !pathname.startsWith("/blog/")) return null;
  if (pathname !== "/blog" && !/^\/blog\/[^/]+$/.test(pathname)) return 404;
  try {
    if (pathname === "/blog") await getPublishedArticles();
    else {
      let slug: string;
      try {
        slug = decodeURIComponent(pathname.slice(6));
      } catch {
        return 404;
      }
      const article = await getPublishedArticle(slug);
      if (!article) return 404;
    }
    return null;
  } catch {
    return 503;
  }
}

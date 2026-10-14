import { getPublishedArticle } from "./api";

// Detail routes need an existence/status check before the public layout starts streaming.
export async function blogRouteStatus(pathname: string): Promise<404 | 503 | null> {
  if (pathname.startsWith("/blog/problem/")) return 404;
  if (pathname !== "/blog" && !pathname.startsWith("/blog/")) return null;
  if (pathname === "/blog") return null;
  if (!/^\/blog\/[^/]+$/.test(pathname)) return 404;
  try {
    let slug: string;
    try {
      slug = decodeURIComponent(pathname.slice(6));
    } catch {
      return 404;
    }
    const article = await getPublishedArticle(slug);
    if (!article) return 404;
    return null;
  } catch {
    return 503;
  }
}

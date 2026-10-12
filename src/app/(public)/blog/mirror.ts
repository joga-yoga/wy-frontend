export const BLOG_MIRROR_HOST = "wiedza.joga.yoga";
export const BLOG_MIRROR_HEADER = "x-joga-blog-mirror";

export function isBlogMirrorHost(host: string | null): boolean {
  return host?.split(":")[0].toLowerCase() === BLOG_MIRROR_HOST;
}

// Leave framework endpoints, metadata and public assets available on the mirror.
export function mirrorBlogRoute(pathname: string): string | 404 | null {
  if (
    /^\/(?:_next|api|images|videos|leaflet)(?:\/|$)/.test(pathname) ||
    ["/favicon.ico", "/robots.txt", "/sitemap.xml", "/next.svg", "/vercel.svg"].includes(pathname)
  ) {
    return null;
  }
  if (pathname === "/") return "/blog";
  if (pathname.startsWith("/artykuly/")) return `/blog/${pathname.slice(10)}`;
  return 404;
}

export function blogNavigationPath(slug?: string, mirror = false): string {
  if (!slug) return mirror ? "/" : "/blog";
  const base = mirror ? "/artykuly" : "/blog";
  return `${base}/${encodeURIComponent(slug)}`;
}

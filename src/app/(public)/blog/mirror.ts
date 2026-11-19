export const BLOG_MIRROR_HOST = "wiedza.joga.yoga";

export function isBlogMirrorHost(host: string | null): boolean {
  const hostname = host?.split(":")[0].toLowerCase();
  return hostname === BLOG_MIRROR_HOST || hostname === `www.${BLOG_MIRROR_HOST}`;
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
  if (/^\/artykuly\/[^/]+$/.test(pathname)) return `/blog/${pathname.slice(10)}`;
  return 404;
}

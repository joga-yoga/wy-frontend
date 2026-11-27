export const BLOG_MIRROR_HOST = "wiedza.joga.yoga";

// Verified replacements from the article migration inventory. The generated
// joga-dla-dzieci-legacy-25 record slug was never a public article alias.
const articleAliases = new Map([
  ["historia-jogi-i-jej-filozofia", "historia-i-filozofia-jogi-w-indiach"],
  ["joga-dla-kobiet-w-ciazy", "joga-prenatalna"],
  ["joga-na-stres", "joga-na-stres-proste-techniki"],
  [
    "naukowe-spojrzenie-komunikacja-z-bliskimi-po-smierci-intuicja",
    "nauka-komunikacja-po-smierci-neurobiologia",
  ],
  [
    "przebudzenie-i-akceptacja-w-praktyce-jogi",
    "wewnetrzne-przebudzenie-i-akceptacja-siebie-w-praktyce-jogi",
  ],
  ["sankalpa-praktyka-jogi-i-zycia", "san-kalpa-praktyka-jogi-i-zycia"],
  ["wspolnota-i-praktyka-jogi", "rola-wspolnoty-w-praktyce-jogi"],
]);

function replacementSlug(slug: string): string | undefined {
  try {
    return articleAliases.get(decodeURIComponent(slug));
  } catch {
    return undefined;
  }
}

export function blogArticleAliasTarget(pathname: string): string | null {
  const slug = /^\/blog\/([^/]+)$/.exec(pathname)?.[1];
  const replacement = slug && replacementSlug(slug);
  return replacement ? "/blog/" + replacement : null;
}

export function isBlogMirrorHost(host: string | null): boolean {
  const hostname = host?.split(":")[0].toLowerCase();
  return hostname === BLOG_MIRROR_HOST || hostname === `www.${BLOG_MIRROR_HOST}`;
}

export function isLegacyEventsHost(host: string | null): boolean {
  return /^(?:www\.)?(?:wyjazdy|wydarzenia)\.yoga$/i.test(host?.split(":")[0] ?? "");
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
  const slug = /^\/artykuly\/([^/]+)$/.exec(pathname)?.[1];
  return slug ? "/blog/" + (replacementSlug(slug) ?? slug) : 404;
}

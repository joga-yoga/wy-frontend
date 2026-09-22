/**
 * The public URLs of the studio directory — one place, so the shape is decided once.
 *
 * The city leads (`/krakow/studia`, `/krakow/studia/hatha`) because `/krakow` itself is being
 * kept for a future city hub spanning studios, instructors and events. Until that hub exists,
 * `src/proxy.ts` answers `/krakow` with a **302** to `/krakow/studia` — temporary on purpose, so
 * the root URL is free to become a page later.
 *
 * National pages stay under `/studia`. One studio stays at `/studio/{slug}`, with no city:
 * its URL must survive a claim, a move and a CRM correction of its city, and a studio slug
 * under `/{city}/studia/` would share a namespace with the style slugs.
 *
 * The folders are English (`[miasto]/studios/`) per the i18n convention; the proxy maps the
 * Polish `studia` segment onto them.
 */

/** `/krakow/studia` — every studio in a city. */
export function cityStudiosPath(citySlug: string): string {
  return `/${citySlug}/studia`;
}

/** `/krakow/studia/hatha` — one style in a city. */
export function cityStylePath(citySlug: string, styleSlug: string): string {
  return `/${citySlug}/studia/${styleSlug}`;
}

/** `/studia/hatha` — one style nationally. */
export function styleHubPath(styleSlug: string): string {
  return `/studia/${styleSlug}`;
}

import { cacheLife, cacheTag } from "next/cache";

import type {
  CityDirectoryPayload,
  CityIndexItem,
  CityStylePayload,
  DirectoryStudioDetail,
  SimilarStudiosPayload,
  StudioDirectoryItem,
  StudiosIndexPayload,
  StyleHubItem,
  StyleHubPayload,
} from "@/types/studio";

/** Server-side `fetch`, not `axiosInstance` — the latter reads a bearer token from
 * `localStorage` and cannot run in a server component. All of this is public data. */
function baseUrl(): string {
  const url = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!url) {
    throw new Error("API_ENDPOINT or NEXT_PUBLIC_API_ENDPOINT is not configured");
  }
  return url;
}

/** The cities that have a page — the fixed list `/[miasto]` resolves against.
 *
 * This is what makes an unknown root segment a hard 404 rather than an empty city page.
 * §7 is explicit that soft-404 sprawl at the root is what this domain cannot afford.
 */
export async function getDirectoryCities(): Promise<CityIndexItem[]> {
  "use cache";

  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  cacheTag("directory", "directory:cities");

  const response = await fetch(`${baseUrl()}/directory/cities`);
  if (!response.ok) {
    throw new Error(`Failed to fetch directory cities: ${response.status}`);
  }
  return response.json();
}

/** One city page. Returns `null` for a segment with no page, which the route turns into a
 * `notFound()` — never an empty page for a city that does not qualify.
 *
 * The studio list arrives already ordered: published first, then the rest, alphabetically
 * under Polish collation within each group. Do not re-sort it here.
 */
export async function getCityDirectory(slug: string): Promise<CityDirectoryPayload | null> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("directory", `directory:city:${slug}`);

  const response = await fetch(`${baseUrl()}/directory/cities/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch city directory: ${response.status}`);
  }
  return response.json();
}

/** `/studia` — the city index, then the towns that did not earn a page but whose studios
 * still need to be reachable from somewhere other than the sitemap. */
export async function getStudiosIndex(): Promise<StudiosIndexPayload> {
  "use cache";

  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });
  cacheTag("directory", "directory:index");

  const response = await fetch(`${baseUrl()}/directory/studios`);
  if (!response.ok) {
    throw new Error(`Failed to fetch studios index: ${response.status}`);
  }
  return response.json();
}

/** One unclaimed directory studio, for the `/studio/{slug}` fallback path.
 *
 * Returns `null` once the listing is claimed — by then the slug has moved onto the `Studio`
 * row and the managed lookup answers for it first. It also returns `null` for a listing that
 * never cleared the content bar, because no such page exists: not indexed, not noindexed,
 * not reachable.
 */
export async function getDirectoryStudio(slug: string): Promise<DirectoryStudioDetail | null> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("directory", `directory:studio:${slug}`);

  const response = await fetch(`${baseUrl()}/directory/studios/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch directory studio: ${response.status}`);
  }
  return response.json();
}

/** One listing by its place id — published or not.
 *
 * ⚠ The claim and removal pages are reached from **recessed** rows, which by definition have
 * no slug. Looking them up by slug is what made the claim flow unreachable for exactly the
 * studios it exists for. `external_id` is the one identifier every listing has.
 */
export async function getDirectoryListing(
  externalId: string,
): Promise<DirectoryStudioDetail | null> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("directory", `directory:listing:${externalId}`);

  const response = await fetch(`${baseUrl()}/directory/listings/${encodeURIComponent(externalId)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch directory listing: ${response.status}`);
  }
  return response.json();
}

const EMPTY_SIMILAR: SimilarStudiosPayload = { city: null, studios: [] };

/** The "nearby" block at the foot of a studio page — either kind of studio slug.
 *
 * ⚠ **Never throws.** The block is an extra: an API hiccup must cost the page its block, not
 * the page itself. Any failure, and a 404, is an empty block, which renders nothing.
 *
 * Same lifetime as the city page it is drawn from, so a studio that leaves the city page
 * leaves every block within the same five minutes.
 */
export async function getSimilarStudios(slug: string): Promise<SimilarStudiosPayload> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("directory", `directory:similar:${slug}`);

  try {
    const response = await fetch(
      `${baseUrl()}/directory/studios/${encodeURIComponent(slug)}/similar`,
    );
    if (!response.ok) return EMPTY_SIMILAR;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch similar studios", error);
    return EMPTY_SIMILAR;
  }
}

/** The styles with a national hub — for the "Style jogi" section on `/studia` and the hubs'
 *  sibling links. Never throws: the section is an extra on those pages. */
export async function getStyleHubs(): Promise<StyleHubItem[]> {
  "use cache";

  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });
  cacheTag("directory", "directory:styles");

  try {
    const response = await fetch(`${baseUrl()}/directory/styles`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch style hubs", error);
    return [];
  }
}

/** `/studia/{style}`. `null` below the gate, which the route turns into a real 404. */
export async function getStyleHub(style: string): Promise<StyleHubPayload | null> {
  "use cache";

  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });
  cacheTag("directory", `directory:style:${style}`);

  const response = await fetch(`${baseUrl()}/directory/styles/${encodeURIComponent(style)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch style hub: ${response.status}`);
  }
  return response.json();
}

/** `/{city}/{style}`. `null` below the gate, which the route turns into a real 404. Same
 *  lifetime as the city page it is cut from. */
export async function getCityStyle(city: string, style: string): Promise<CityStylePayload | null> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("directory", `directory:city:${city}`, `directory:style:${style}`);

  const response = await fetch(
    `${baseUrl()}/directory/cities/${encodeURIComponent(city)}/styles/${encodeURIComponent(style)}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch city style page: ${response.status}`);
  }
  return response.json();
}


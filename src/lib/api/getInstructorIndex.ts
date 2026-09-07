import { cacheLife, cacheTag } from "next/cache";

import type { InstructorIndexItem } from "@/types/instructor";

/** Every instructor listed on `/instruktorzy`, already ordered by name under Polish
 * collation by the backend.
 *
 * No paging parameters, deliberately — the directory is one crawlable document, and the
 * endpoint takes none. Ordering is done in SQL rather than here so it stays correct if
 * that ever changes: a client-side sort of one page is not a sort.
 *
 * Server-side `fetch`, not `axiosInstance` — the latter reads a bearer token from
 * `localStorage` and cannot run in a server component. This is public data anyway.
 */
export async function getInstructorIndex(): Promise<InstructorIndexItem[]> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 1800 });
  cacheTag("instructors", "instructors:index");

  const baseUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("API_ENDPOINT or NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const response = await fetch(`${baseUrl}/instructors/index`);
  if (!response.ok) {
    throw new Error(`Failed to fetch instructor index: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

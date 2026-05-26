import { cacheLife, cacheTag } from "next/cache";

import { Event } from "@/app/(public)/retreats/types";

export type EventListKind = "classes" | "retreats" | "workshops";

export async function getCachedEventList(
  kind: EventListKind,
  queryString: string,
): Promise<{ items: Event[]; total: number }> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag(kind);

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/${kind}/public?${queryString}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${kind}: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

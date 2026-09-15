import { cacheLife, cacheTag } from "next/cache";

import type { StudioPublic } from "@/types/studio";

/**
 * ⚠ **Returns `null` for a missing studio — it must not throw.**
 *
 * It used to throw `StudioNotFoundError`, which `getStudio` caught and turned into `null`.
 * That works in development and **fails in a production build**: an error thrown inside a
 * `"use cache"` function crosses the cache boundary redacted — Next replaces it with a
 * generic `Error` whose message and `name` are stripped — so `isStudioNotFoundError` sees an
 * anonymous error, `getStudio` rethrows, and the reader gets *"This page couldn't load"*
 * instead of a not-found page.
 *
 * It went unnoticed because nothing linked to a studio slug that had no studio. The public
 * directory is the first thing that does: an unclaimed listing serves `/studio/{slug}` from
 * the directory table, so the managed lookup is *expected* to miss.
 *
 * A sentinel value crosses the boundary intact; an exception does not.
 */
async function getCachedStudio(slug: string): Promise<StudioPublic | null> {
  "use cache";

  cacheLife({ stale: 900, revalidate: 900, expire: 3600 });
  cacheTag("studios", `studio:${slug}`);

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/public/studios/${slug}`);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch studio: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getStudio(slug: string): Promise<StudioPublic | null> {
  try {
    return await getCachedStudio(slug);
  } catch (error) {
    // A genuine failure — unreachable API or a 5xx. Still caught and rethrown so the reason
    // reaches the server log before the error boundary redacts it.
    console.error("Error fetching studio:", error);
    throw error;
  }
}

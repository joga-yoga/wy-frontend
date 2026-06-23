import { cacheLife, cacheTag } from "next/cache";

import type { StudioPublic } from "@/types/studio";

export class StudioNotFoundError extends Error {
  constructor(readonly slug: string) {
    super(`Studio not found: ${slug}`);
    this.name = "StudioNotFoundError";
  }
}

export function isStudioNotFoundError(error: unknown): error is StudioNotFoundError {
  return error instanceof StudioNotFoundError || (error as Error)?.name === "StudioNotFoundError";
}

async function getCachedStudio(slug: string): Promise<StudioPublic> {
  "use cache";

  cacheLife({ stale: 900, revalidate: 900, expire: 3600 });
  cacheTag("studios", `studio:${slug}`);

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/public/studios/${slug}`);

  if (res.status === 404) {
    throw new StudioNotFoundError(slug);
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
    if (isStudioNotFoundError(error)) {
      return null;
    }
    console.error("Error fetching studio:", error);
    throw error;
  }
}

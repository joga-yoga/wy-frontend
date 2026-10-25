import { cacheLife, cacheTag } from "next/cache";

import type { InstructorDetails } from "@/types/instructor";

async function getCachedInstructor(slug: string): Promise<InstructorDetails | null> {
  "use cache";

  cacheLife({ stale: 900, revalidate: 900, expire: 3600 });
  cacheTag("instructors", `instructor:${slug}`);

  const baseUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("API_ENDPOINT or NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/instructor/${slug}`);

  if (res.status === 404) {
    // Return a sentinel: errors crossing a use-cache boundary lose their identity.
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch instructor: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getInstructor(slug: string): Promise<InstructorDetails | null> {
  try {
    return await getCachedInstructor(slug);
  } catch (error) {
    console.error("Error fetching instructor:", error);
    throw error;
  }
}

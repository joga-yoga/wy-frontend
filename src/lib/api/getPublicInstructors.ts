import { cacheLife, cacheTag } from "next/cache";

import type { InstructorPublicListItem } from "@/types/instructor";

export async function getPublicInstructors({
  limit = 2,
  excludeSlug,
}: {
  limit?: number;
  excludeSlug?: string;
} = {}): Promise<InstructorPublicListItem[]> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 1800 });
  cacheTag("instructors", "instructors:public");

  const baseUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("API_ENDPOINT or NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const params = new URLSearchParams({ limit: String(limit) });
  if (excludeSlug) params.set("excludeSlug", excludeSlug);

  const response = await fetch(`${baseUrl}/instructors/public?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch public instructors: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

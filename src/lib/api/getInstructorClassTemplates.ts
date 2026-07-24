import { cacheLife, cacheTag } from "next/cache";

import type { InstructorClassTemplateListResponse } from "@/app/(public)/instructor/[slug]/classes/types";

async function getCachedInstructorClassTemplates(
  slug: string,
): Promise<InstructorClassTemplateListResponse> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 1800 });
  cacheTag("instructors", `instructor:${slug}`, `instructor:${slug}:class-templates`);

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/public/instructors/${slug}/class-templates`);

  if (res.status === 404) {
    return { total: 0, items: [] };
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch instructor class templates: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getInstructorClassTemplates(
  slug: string,
): Promise<InstructorClassTemplateListResponse> {
  try {
    return await getCachedInstructorClassTemplates(slug);
  } catch (error) {
    console.error("Error fetching instructor class templates:", error);
    throw error;
  }
}

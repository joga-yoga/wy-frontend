import { cacheLife, cacheTag } from "next/cache";

import type { ClassTemplateListResponse } from "@/app/(public)/studio/[slug]/classes/types";

async function getCachedStudioClassTemplates(slug: string): Promise<ClassTemplateListResponse> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 1800 });
  cacheTag("studios", `studio:${slug}`, `studio:${slug}:class-templates`);

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/public/studios/${slug}/class-templates`);

  if (res.status === 404) {
    return { total: 0, items: [] };
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch studio class templates: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getStudioClassTemplates(slug: string): Promise<ClassTemplateListResponse> {
  try {
    return await getCachedStudioClassTemplates(slug);
  } catch (error) {
    console.error("Error fetching studio class templates:", error);
    throw error;
  }
}

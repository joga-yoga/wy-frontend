import { cacheLife, cacheTag } from "next/cache";

import type { ClassTemplateDetail } from "@/app/(public)/studio/[slug]/classes/types";

export class ClassTemplateNotFoundError extends Error {
  constructor(
    readonly studioSlug: string,
    readonly classSlug: string,
  ) {
    super(`Class template not found: ${studioSlug}/${classSlug}`);
    this.name = "ClassTemplateNotFoundError";
  }
}

export function isClassTemplateNotFoundError(error: unknown): error is ClassTemplateNotFoundError {
  return (
    error instanceof ClassTemplateNotFoundError ||
    (error as Error)?.name === "ClassTemplateNotFoundError"
  );
}

async function getCachedClassTemplateDetail(
  studioSlug: string,
  classSlug: string,
): Promise<ClassTemplateDetail> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 1800 });
  cacheTag(
    "studios",
    `studio:${studioSlug}`,
    `studio:${studioSlug}:class-templates`,
    `class-template:${studioSlug}:${classSlug}`,
  );

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/public/studios/${studioSlug}/class-templates/${classSlug}`);

  if (res.status === 404) {
    throw new ClassTemplateNotFoundError(studioSlug, classSlug);
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch class template: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getClassTemplateDetail(
  studioSlug: string,
  classSlug: string,
): Promise<ClassTemplateDetail | null> {
  try {
    return await getCachedClassTemplateDetail(studioSlug, classSlug);
  } catch (error) {
    if (isClassTemplateNotFoundError(error)) {
      return null;
    }
    console.error("Error fetching class template detail:", error);
    throw error;
  }
}

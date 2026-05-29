import { cacheLife, cacheTag } from "next/cache";

import type { InstructorDetails } from "@/types/instructor";

export class InstructorNotFoundError extends Error {
  constructor(readonly slug: string) {
    super(`Instructor not found: ${slug}`);
    this.name = "InstructorNotFoundError";
  }
}

export function isInstructorNotFoundError(error: unknown): error is InstructorNotFoundError {
  return (
    error instanceof InstructorNotFoundError || (error as Error)?.name === "InstructorNotFoundError"
  );
}

async function getCachedInstructor(slug: string): Promise<InstructorDetails> {
  "use cache";

  cacheLife({ stale: 900, revalidate: 900, expire: 3600 });
  cacheTag("instructors", `instructor:${slug}`);

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/instructor/${slug}`);

  if (res.status === 404) {
    throw new InstructorNotFoundError(slug);
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
    if (isInstructorNotFoundError(error)) {
      return null;
    }
    console.error("Error fetching instructor:", error);
    throw error;
  }
}

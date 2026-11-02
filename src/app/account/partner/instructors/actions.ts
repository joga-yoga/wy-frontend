"use server";

import { updateTag } from "next/cache";

import { axiosInstance } from "@/lib/axiosInstance";
import type { InstructorProfile } from "@/types/instructor";

/** Verify edit access through the existing API before expiring this profile's cache. */
export async function refreshInstructorProfileCache(
  instructorId: string,
  previousSlug: string | null,
  accessToken: string | null,
): Promise<boolean> {
  if (!accessToken) return false;

  try {
    const { data } = await axiosInstance.get<InstructorProfile>(
      `/instructors/${encodeURIComponent(instructorId)}`,
      {
        baseURL: process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT,
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      },
    );

    for (const slug of new Set([previousSlug, data.slug])) {
      if (slug) updateTag(`instructor:${slug}`);
    }
    return true;
  } catch {
    // The write has already succeeded. Do not log credentials or repeat the mutation.
    return false;
  }
}

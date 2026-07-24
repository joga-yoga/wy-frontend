import type { InstructorPublicSchedulePreviewResponse } from "@/app/(public)/instructor/[slug]/schedule/types";

export async function getInstructorSchedulePreview(
  instructorSlug: string,
  limit = 3,
): Promise<InstructorPublicSchedulePreviewResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(
    `${baseUrl}/public/instructors/${instructorSlug}/schedule/preview?${params}`,
    { cache: "no-store" },
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Failed to fetch instructor schedule preview: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

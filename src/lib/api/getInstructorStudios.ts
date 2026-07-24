import type { StudioCardData } from "@/components/common/StudioCard";

export async function getInstructorStudios(instructorSlug: string): Promise<StudioCardData[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/public/instructors/${instructorSlug}/studios`, {
    cache: "no-store",
  });

  if (res.status === 404) return [];

  if (!res.ok) {
    throw new Error(`Failed to fetch instructor studios: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

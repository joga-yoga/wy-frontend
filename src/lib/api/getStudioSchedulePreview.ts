import type { PublicSchedulePreviewResponse } from "@/app/(public)/studio/[slug]/schedule/types";

export async function getStudioSchedulePreview(
  studioId: string,
  limit = 3,
  classTemplateId?: string,
): Promise<PublicSchedulePreviewResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const params = new URLSearchParams({ limit: String(limit) });
  if (classTemplateId) {
    params.set("class_template_id", classTemplateId);
  }
  const res = await fetch(`${baseUrl}/public/studios/${studioId}/schedule/preview?${params}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Failed to fetch studio schedule preview: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

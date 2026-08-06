import type { GeneratedStudioProfileDraft } from "@/types/studio";

export async function getGeneratedStudioProfileDraft(
  token: string,
): Promise<GeneratedStudioProfileDraft | null> {
  const baseUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) throw new Error("API_ENDPOINT or NEXT_PUBLIC_API_ENDPOINT is not configured");

  const response = await fetch(`${baseUrl}/studio-profile-drafts/${token}`, {
    cache: "no-store",
  });
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch studio profile draft: ${response.status}`);
  }
  return response.json();
}

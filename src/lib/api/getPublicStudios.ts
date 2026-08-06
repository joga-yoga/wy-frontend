import type { StudioPublicListItem } from "@/types/studio";

export async function getPublicStudios(limit = 3): Promise<StudioPublicListItem[]> {
  const baseUrl = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) throw new Error("API_ENDPOINT or NEXT_PUBLIC_API_ENDPOINT is not configured");
  const response = await fetch(`${baseUrl}/public/studios?limit=${limit}`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Failed to fetch public studios: ${response.status}`);
  return response.json();
}

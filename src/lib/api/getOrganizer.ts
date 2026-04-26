import { cacheLife, cacheTag } from "next/cache";

import { OrganizerDetails, OrganizerReview } from "@/components/page-contents/organizer/types";

export class OrganizerNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Organizer not found: ${id}`);
    this.name = "OrganizerNotFoundError";
  }
}

export function isOrganizerNotFoundError(error: unknown): error is OrganizerNotFoundError {
  return (
    error instanceof OrganizerNotFoundError || (error as Error)?.name === "OrganizerNotFoundError"
  );
}

async function getCachedOrganizer(id: string): Promise<OrganizerDetails> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("organizers", `organizer:${id}`);

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/partner/${id}`);

  if (res.status === 404) {
    throw new OrganizerNotFoundError(id);
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch organizer: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    organizer: data.partner,
    upcoming_retreats: data.upcoming_retreats,
    past_retreats: data.past_retreats,
    upcoming_workshops: data.upcoming_workshops,
    past_workshops: data.past_workshops,
  };
}

export async function getOrganizer(id: string): Promise<OrganizerDetails | null> {
  try {
    return await getCachedOrganizer(id);
  } catch (error) {
    if (isOrganizerNotFoundError(error)) {
      return null;
    }

    console.error("Error fetching organizer:", error);
    throw error;
  }
}

export async function getOrganizerReviews(
  placeId: string,
  limit = 10,
  offset = 0,
): Promise<{ reviews: OrganizerReview[]; has_more: boolean } | null> {
  try {
    return await getCachedOrganizerReviews(placeId, limit, offset);
  } catch (error) {
    console.error("Error fetching organizer reviews:", error);
    return null;
  }
}

async function getCachedOrganizerReviews(
  placeId: string,
  limit: number,
  offset: number,
): Promise<{ reviews: OrganizerReview[]; has_more: boolean }> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("organizers", `organizer-reviews:${placeId}`);

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/partner/reviews/${placeId}?limit=${limit}&offset=${offset}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch reviews: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

import { unstable_cache } from "next/cache";

import { OrganizerDetails, OrganizerReview } from "@/components/page-contents/organizer/types";

export async function getOrganizer(id: string): Promise<OrganizerDetails | null> {
  return unstable_cache(
    async (organizerId: string): Promise<OrganizerDetails | null> => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/organizer/${organizerId}`);

        if (res.status === 404) {
          return null;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch organizer: ${res.statusText}`);
        }

        return res.json();
      } catch (error) {
        console.error("Error fetching organizer:", error);
        return null;
      }
    },
    ["organizer-detail", id],
    {
      revalidate: 300,
      tags: ["organizers"],
    },
  )(id);
}

export async function getOrganizerReviews(
  placeId: string,
  limit = 10,
  offset = 0,
): Promise<{ reviews: OrganizerReview[]; has_more: boolean } | null> {
  const cacheKey = `${placeId}:${limit}:${offset}`;

  return unstable_cache(
    async (
      organizerPlaceId: string,
      reviewsLimit: number,
      reviewsOffset: number,
    ): Promise<{ reviews: OrganizerReview[]; has_more: boolean } | null> => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_ENDPOINT}/organizer/reviews/${organizerPlaceId}?limit=${reviewsLimit}&offset=${reviewsOffset}`,
        );

        if (!res.ok) {
          // Reviews might fail independently, so just return null or empty
          console.error(`Failed to fetch reviews: ${res.statusText}`);
          return null;
        }

        return res.json();
      } catch (error) {
        console.error("Error fetching organizer reviews:", error);
        return null;
      }
    },
    ["organizer-reviews", cacheKey],
    {
      revalidate: 300,
      tags: ["organizers"],
    },
  )(placeId, limit, offset);
}

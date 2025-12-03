import { OrganizerDetails, OrganizerReview } from "@/components/page-contents/organizer/types";

export async function getOrganizer(id: string): Promise<OrganizerDetails | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/organizer/${id}`, {
      next: { revalidate: 300 },
    });

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
}

export async function getOrganizerReviews(
  placeId: string,
  limit = 10,
  offset = 0,
): Promise<{ reviews: OrganizerReview[]; has_more: boolean } | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT}/organizer/reviews/${placeId}?limit=${limit}&offset=${offset}`,
      {
        next: { revalidate: 300 },
      },
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
}

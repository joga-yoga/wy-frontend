import React from "react";

import { OrganizerPageContent } from "@/components/page-contents/organizer/OrganizerPageContent";
import { getOrganizer, getOrganizerReviews } from "@/lib/api/getOrganizer";

export const revalidate = 300;

interface OrganizerPageProps {
  params: Promise<{ organizerId: string }>;
}

export default async function OrganizerPage({ params }: OrganizerPageProps) {
  const { organizerId } = await params;

  if (!organizerId) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-red-600">
        Error: Organizer ID not found.
      </div>
    );
  }

  const organizer = await getOrganizer(organizerId);

  if (!organizer) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-gray-500">
        Organizer details could not be loaded or organizer not found.
      </div>
    );
  }

  let reviews: any[] = [];
  let hasMoreReviews = false;

  if (organizer.organizer.google_place_id) {
    const reviewsData = await getOrganizerReviews(organizer.organizer.google_place_id);
    if (reviewsData) {
      reviews = reviewsData.reviews;
      hasMoreReviews = reviewsData.has_more;
    }
  }

  return (
    <OrganizerPageContent organizer={organizer} reviews={reviews} hasMoreReviews={hasMoreReviews} />
  );
}

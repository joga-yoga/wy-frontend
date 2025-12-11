import { Metadata, ResolvingMetadata } from "next";
import React from "react";

import { OrganizerPageContent } from "@/components/page-contents/organizer/OrganizerPageContent";
import { getOrganizer, getOrganizerReviews } from "@/lib/api/getOrganizer";
import { getOgImageUrl } from "@/lib/imageHelpers";

export const revalidate = 300;

interface OrganizerPageProps {
  params: Promise<{ organizerId: string }>;
}

export async function generateMetadata(
  { params }: OrganizerPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { organizerId } = await params;
  const organizerData = await getOrganizer(organizerId);

  if (!organizerData) {
    return {
      title: "Organizer Not Found",
    };
  }

  const { organizer } = organizerData;
  const title = `${organizer.name || "Organizator"} | wydarzenia.yoga`;
  const description = organizer.description || "Zobacz profil organizatora na wydarzenia.yoga";
  const imageUrl = getOgImageUrl(organizer.image_id);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `/organizer/${organizerId}`,
      languages: {
        pl: `/organizer/${organizerId}`,
      },
    },
  };
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

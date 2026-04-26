import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { OrganizerPageContent } from "@/components/page-contents/organizer/OrganizerPageContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getOrganizer, getOrganizerReviews } from "@/lib/api/getOrganizer";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildOrganizerJsonLd, buildPageMetadata } from "@/lib/seo";

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
    notFound();
  }

  const { organizer } = organizerData;
  const title = `${organizer.name || "Partner"} | wyjazdy.yoga`;
  const description = organizer.description || "Zobacz profil partnera na wyjazdy.yoga";
  const imageUrl = getOgImageUrl(organizer.image_id);

  return {
    ...buildPageMetadata({
      project: "retreats",
      title,
      description,
      path: `/partner/${organizerId}`,
      image: imageUrl || undefined,
    }),
  };
}

export default async function OrganizerPage({ params }: OrganizerPageProps) {
  const { organizerId } = await params;

  if (!organizerId) {
    notFound();
  }

  const organizer = await getOrganizer(organizerId);

  if (!organizer) {
    notFound();
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

  const imageUrl = getOgImageUrl(organizer.organizer.image_id);

  return (
    <>
      <JsonLd
        data={buildOrganizerJsonLd({
          project: "retreats",
          path: `/partner/${organizerId}`,
          organizer: organizer.organizer,
          imageUrl: imageUrl || undefined,
        })}
      />
      <OrganizerPageContent
        organizer={organizer}
        reviews={reviews}
        hasMoreReviews={hasMoreReviews}
      />
    </>
  );
}

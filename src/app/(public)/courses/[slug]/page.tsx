import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import React from "react";

import { EventHeader, ImageGallery } from "@/app/(public)/retreats/[slug]/components";
import { JsonLd } from "@/components/seo/JsonLd";
import { isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";
import { getCourse } from "@/lib/api/getCourse";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildEventJsonLd, buildPageMetadata } from "@/lib/seo";

import { CourseBottomBar } from "./components/CourseBottomBar";
import { CourseMainContent } from "./components/CourseMainContent";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: CourseDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  await connection();
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const event = await getCourse(slug).catch((error) => {
    if (isEventDetailNotFoundError(error)) {
      notFound();
    }
    throw error;
  });

  const title = `${event.title} | joga.yoga`;
  const description = event.description || "Zobacz szczegóły kursu na joga.yoga";
  const imageId = event.image_ids && event.image_ids.length > 0 ? event.image_ids[0] : null;
  const imageUrl = getOgImageUrl(imageId);

  return {
    ...buildPageMetadata({
      project: "workshops",
      title,
      description,
      path: `/kursy/${slug}`,
      image: imageUrl || undefined,
    }),
  };
}

const CourseDetailPage = async ({ params }: CourseDetailPageProps) => {
  await connection();
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const event = await getCourse(slug).catch((error) => {
    if (isEventDetailNotFoundError(error)) {
      notFound();
    }
    throw error;
  });

  const imageUrl = getOgImageUrl(event.image_ids?.[0] ?? null);

  return (
    <div className="bg-white">
      <JsonLd
        data={buildEventJsonLd({
          project: "workshops",
          path: `/kursy/${slug}`,
          event,
          imageUrl: imageUrl || undefined,
        })}
      />
      <div className="container-wy mx-auto p-4 pb-3 md:p-8">
        <div className="flex flex-col gap-4">
          <ImageGallery title={event.title} image_ids={event.image_ids || []} />
          <EventHeader title={event.title} eventId={slug} />
        </div>
        <CourseMainContent event={event} eventSlug={slug} />
      </div>
      <CourseBottomBar event={event} />
    </div>
  );
};

export default CourseDetailPage;

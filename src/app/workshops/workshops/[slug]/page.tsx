import { Metadata, ResolvingMetadata } from "next";
import React from "react";

import {
  EventHeader,
  EventLocation,
  EventMainContent,
  EventSidebar,
  ImageGallery,
} from "@/app/retreats/retreats/[slug]/components";
import { isMultiDayEvent } from "@/app/retreats/retreats/[slug]/helpers";
import { getWorkshop } from "@/lib/api/getWorkshop";
import { getOgImageUrl } from "@/lib/imageHelpers";

export const revalidate = 300;

interface WorkshopDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: WorkshopDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const event = await getWorkshop(slug);

  if (!event) {
    return {
      title: "Event Not Found",
    };
  }

  const title = `${event.title} | wydarzenia.yoga`;
  const description = event.description || "Zobacz szczegóły wydarzenia na wydarzenia.yoga";
  const imageId = event.image_ids && event.image_ids.length > 0 ? event.image_ids[0] : null;
  const imageUrl = getOgImageUrl(imageId);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `/workshops/${slug}`,
      languages: {
        pl: `/workshops/${slug}`,
      },
    },
  };
}

const WorkshopDetailPage = async ({ params }: WorkshopDetailPageProps) => {
  const { slug } = await params;

  if (!slug) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-red-600">
        Error: Event Slug not found.
      </div>
    );
  }

  const event = await getWorkshop(slug);

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-gray-500">
        Event details could not be loaded or event not found.
      </div>
    );
  }

  const isMultiDay = isMultiDayEvent(event.start_date, event.end_date);
  return (
    <div className="bg-white">
      <div className="container-wy mx-auto p-4 pb-3 md:p-8">
        <EventHeader title={event.title} eventId={slug} />
        <ImageGallery title={event.title} image_ids={event.image_ids || []} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_428px] gap-y-10 lg:gap-y-0 lg:gap-x-16 mt-3 md:mt-[44px]">
          <EventSidebar
            event={event}
            className="lg:col-span-1 order-1 lg:order-2"
            project="workshops"
            isMultiDay={isMultiDay}
          />
          <EventMainContent
            event={event}
            className="lg:col-span-2 order-2 lg:order-1"
            project="workshops"
            isMultiDay={isMultiDay}
          />
        </div>

        <div className="mt-[44px]">
          <EventLocation id="map" location={event.location} title={event.title} />
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetailPage;

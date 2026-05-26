import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import React from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";
import { getRetreat } from "@/lib/api/getRetreat";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildEventJsonLd, buildPageMetadata } from "@/lib/seo";

import {
  EventHeader,
  EventLocation,
  EventMainContent,
  EventSidebar,
  ImageGallery,
} from "./components";
import { isMultiDayEvent } from "./helpers";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: EventDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  await connection();
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const event = await getRetreat(slug).catch((error) => {
    if (isEventDetailNotFoundError(error)) {
      notFound();
    }
    throw error;
  });

  const title = `${event.title} | joga.yoga`;
  const description = event.description || "Zobacz szczegóły wyjazdu na joga.yoga";
  const imageId = event.image_ids && event.image_ids.length > 0 ? event.image_ids[0] : null;
  const imageUrl = getOgImageUrl(imageId);

  return {
    ...buildPageMetadata({
      project: "retreats",
      title,
      description,
      path: `/wyjazdy/${slug}`,
      image: imageUrl || undefined,
    }),
  };
}

const EventDetailPage = async ({ params }: EventDetailPageProps) => {
  await connection();
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const event = await getRetreat(slug).catch((error) => {
    if (isEventDetailNotFoundError(error)) {
      notFound();
    }
    throw error;
  });
  const isMultiDay = isMultiDayEvent(event.start_date, event.end_date);
  const imageId = event.image_ids && event.image_ids.length > 0 ? event.image_ids[0] : null;
  const imageUrl = getOgImageUrl(imageId);

  return (
    <div className="bg-white">
      <JsonLd
        data={buildEventJsonLd({
          project: "retreats",
          path: `/wyjazdy/${slug}`,
          event,
          imageUrl: imageUrl || undefined,
        })}
      />
      <div className="container-wy mx-auto p-4 pb-3 md:p-8">
        <EventHeader title={event.title} eventId={slug} />
        <ImageGallery title={event.title} image_ids={event.image_ids || []} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_400px] gap-y-10 lg:gap-y-0 lg:gap-x-16 mt-3 md:mt-[44px]">
          <EventSidebar
            event={event}
            className="lg:col-span-1 order-1 lg:order-2"
            project="retreats"
            isMultiDay={isMultiDay}
          />
          <EventMainContent
            event={event}
            className="lg:col-span-2 order-2 lg:order-1"
            project="retreats"
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

export default EventDetailPage;

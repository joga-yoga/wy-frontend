import React from "react";

import { getRetreat } from "@/lib/api/getRetreat";

import {
  EventHeader,
  EventLocation,
  EventMainContent,
  EventSidebar,
  ImageGallery,
} from "./components";

export const revalidate = 300;

interface EventDetailPageProps {
  params: Promise<{ retreatId: string }>;
}

const EventDetailPage = async ({ params }: EventDetailPageProps) => {
  const { retreatId } = await params;

  if (!retreatId) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-red-600">
        Error: Event ID not found.
      </div>
    );
  }

  const event = await getRetreat(retreatId);

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-gray-500">
        Event details could not be loaded or event not found.
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="container-wy mx-auto p-4 pb-3 md:p-8">
        <EventHeader title={event.title} eventId={retreatId} />
        <ImageGallery title={event.title} image_ids={event.image_ids || []} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_400px] gap-y-10 lg:gap-y-0 lg:gap-x-16 mt-3 md:mt-[44px]">
          <EventSidebar
            event={event}
            className="lg:col-span-1 order-1 lg:order-2"
            project="retreats"
          />
          <EventMainContent
            event={event}
            className="lg:col-span-2 order-2 lg:order-1"
            project="retreats"
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

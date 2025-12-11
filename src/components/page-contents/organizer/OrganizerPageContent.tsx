"use client";

import Image from "next/image";
import React from "react";

import { getImageUrl } from "@/app/retreats/retreats/[slug]/helpers";

import { EventSection, ReviewSection } from "./components";
import { OrganizerDetails, OrganizerReview } from "./types";

interface OrganizerPageContentProps {
  organizer: OrganizerDetails;
  reviews: OrganizerReview[];
  hasMoreReviews: boolean;
}

export const OrganizerPageContent: React.FC<OrganizerPageContentProps> = ({
  organizer,
  reviews,
  hasMoreReviews,
}) => {
  return (
    <div className="bg-white text-gray-800">
      <div className="container-wy mx-auto p-4 pb-3 md:p-8">
        <div className="flex flex-col gap-[44px]">
          <div className="flex flex-col md:flex-row gap-[29px]">
            <div className="w-full md:w-[402px] md:h-[245px] px-5 py-[28px] border border-gray-100 rounded-[22px] shadow-[0px_8px_16px_8px_#FAFAFA] flex flex-col items-center justify-center text-center gap-3">
              <div className="relative h-[88px] w-[88px]">
                <Image
                  src={getImageUrl(organizer.organizer.image_id, 0)}
                  alt={organizer.organizer.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <p className="text-h-small text-gray-800">{organizer.organizer.name}</p>
              <p className="text-gray-400 text-sm">{organizer.organizer.name}</p>
            </div>

            <div className="w-full md:w-[669px] md:h-[245px] flex flex-col justify-center">
              <h2 className="text-h-small md:text-h-big text-gray-800 mb-[45px]">
                {organizer.organizer.name}
              </h2>
              <p className="text-m-descript md:text-descrip-under-header text-gray-500">
                {organizer.organizer.description}
              </p>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="flex flex-col gap-[44px]">
            {reviews.length > 0 && organizer.organizer.google_place_id && (
              <ReviewSection
                title={`Co mówią o ${organizer.organizer.name}`}
                reviews={reviews}
                initialHasMore={hasMoreReviews}
                image={getImageUrl(organizer.organizer.image_id, 0)}
                placeId={organizer.organizer.google_place_id}
              />
            )}
            {organizer.upcoming_retreats.length > 0 && (
              <EventSection
                title="Planowane wyjazdy"
                events={organizer.upcoming_retreats}
                project="retreats"
              />
            )}
            {organizer.past_retreats.length > 0 && (
              <EventSection
                title="Zakończone wyjazdy"
                events={organizer.past_retreats}
                project="retreats"
              />
            )}
            {organizer.upcoming_workshops.length > 0 && (
              <EventSection
                title="Planowane wydarzenia"
                events={organizer.upcoming_workshops}
                project="workshops"
              />
            )}
            {organizer.past_workshops.length > 0 && (
              <EventSection
                title="Zakończone wydarzenia"
                events={organizer.past_workshops}
                project="workshops"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import Link from "next/link";
import React from "react";

import { WyImage } from "@/components/custom/WyImage";

import { EventDetail } from "../types";

interface InstructorSectionProps {
  event: EventDetail;
  eventSlug?: string;
  project?: "retreats" | "workshops";
}

export const InstructorSection: React.FC<InstructorSectionProps> = ({
  event,
  eventSlug,
  project,
}) => {
  if (!event.instructors || event.instructors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <h2 className="text-listing-description md:text-h-middle text-gray-800">Instruktor</h2>
      {event.instructors.map((instructor) => {
        const card = (
          <div
            key={instructor.id}
            className="px-5 py-[28px] border border-gray-100 rounded-[22px] shadow-[0px_8px_16px_8px_#FAFAFA] flex flex-col items-center text-center"
          >
            {instructor.image_id && (
              <div className="relative h-[88px] w-[88px] mb-3">
                <WyImage
                  src={instructor.image_id}
                  alt={instructor.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            )}
            <h3 className="text-middle-header-22 text-gray-800">{instructor.name}</h3>
            {(instructor.short_bio ?? instructor.description) && (
              <p className="text-m-descript md:text-sub-descript-18 text-gray-500 text-left whitespace-pre-line mt-2">
                {instructor.short_bio ?? instructor.description}
              </p>
            )}
            {instructor.slug && (
              <span className="mt-3 text-sm text-primary underline-offset-2 hover:underline">
                Zobacz profil
              </span>
            )}
          </div>
        );

        const fromPrefix = project === "workshops" ? "/wydarzenia" : "/wyjazdy";
        const instructorHref =
          instructor.slug && eventSlug
            ? `/instructor/${instructor.slug}?from=${fromPrefix}/${eventSlug}`
            : instructor.slug
              ? `/instructor/${instructor.slug}`
              : null;

        return instructorHref ? (
          <Link key={instructor.id} href={instructorHref}>
            {card}
          </Link>
        ) : (
          <React.Fragment key={instructor.id}>{card}</React.Fragment>
        );
      })}
    </div>
  );
};

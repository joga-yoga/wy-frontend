import Image from "next/image";
import React from "react";

import { getImageUrl } from "../helpers";
import { EventDetail } from "../types";

interface InstructorSectionProps {
  event: EventDetail;
}

export const InstructorSection: React.FC<InstructorSectionProps> = ({ event }) => {
  if (!event.instructors || event.instructors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <h2 className="text-listing-description md:text-h-middle text-gray-800">Instruktor</h2>
      {event.instructors.map((instructor) => (
        <div
          key={instructor.id}
          className="px-5 py-[28px] border border-gray-100 rounded-[22px] shadow-[0px_8px_16px_8px_#FAFAFA] flex flex-col items-center text-center"
        >
          <div className="relative h-[88px] w-[88px] mb-3">
            <Image
              src={getImageUrl(instructor.image_id, 0)}
              alt={instructor.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <h3 className="text-middle-header-22 text-gray-800">{instructor.name}</h3>
          {instructor.bio && (
            <p className="text-descrip-under-header text-gray-400">{instructor.bio}</p>
          )}
        </div>
      ))}
    </div>
  );
};

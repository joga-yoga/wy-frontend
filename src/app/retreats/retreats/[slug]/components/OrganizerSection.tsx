import Image from "next/image";
import Link from "next/link";
import React from "react";

import { getImageUrl } from "@/app/retreats/retreats/[slug]/helpers";

import { EventDetail } from "../types";

interface OrganizerSectionProps {
  event: EventDetail;
  project: "retreats" | "workshops";
}

export const OrganizerSection: React.FC<OrganizerSectionProps> = ({ event, project }) => {
  if (!event.organizer) {
    return null;
  }

  const organizerCtaText =
    project === "workshops"
      ? "Jesteś organizatorem tego wydarzenia?"
      : "Jesteś organizatorem tego wyjazdu?";

  return (
    <div className="md:px-5">
      <Link
        href={`/organizer/${event.organizer.id}`}
        className="flex items-center gap-5 hover:opacity-80 transition"
      >
        <div className="relative h-[80px] w-[80px] flex-shrink-0">
          <Image
            src={getImageUrl(event.organizer.image_id, 1)}
            alt={event.organizer.name}
            fill
            className="rounded-full object-cover border"
          />
        </div>
        <div>
          <p className="text-subheader">Organizator</p>
          <p className="text-sub-descript-18 text-gray-500">{event.organizer.name}</p>
        </div>
      </Link>
      <p className="mt-4 text-md md:text-lg font-medium text-gray-500 pt-4 md:pt-7">
        {organizerCtaText} <br />
        <Link
          href={`/contact?eventId=${event.id}`}
          className="text-black underline hover:opacity-50 transition"
        >
          Przejmij i edytuj
        </Link>
      </p>
    </div>
  );
};

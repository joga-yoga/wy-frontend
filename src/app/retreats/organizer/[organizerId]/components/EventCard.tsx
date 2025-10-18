"use client";

import Image from "next/image";
import Link from "next/link";

import { truncateText } from "@/app/retreats/organizer/[organizerId]/helpers";
import { OrganizerEvent } from "@/app/retreats/organizer/[organizerId]/types";
import { getImageUrl } from "@/app/retreats/retreats/[retreatId]/helpers";

interface EventCardProps {
  event: OrganizerEvent;
}

const EventCard = ({ event }: EventCardProps) => {
  return (
    <Link href={`/${event.id}`}>
      <div className="w-full max-w-[402px] flex flex-col items-start">
        <div className="relative w-full max-w-[358px] aspect-[16/10] rounded-[11px] overflow-hidden mt-6 mb-5 shrink-0">
          <Image
            src={getImageUrl(event.image_ids[0])}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>
        <p className="w-full max-w-[358px] text-left text-m-header md:text-sub-descript-18 mb-2 line-clamp-2">
          {event.title}
        </p>

        <p className="w-full max-w-[358px] text-left text-m-descript md:text-sub-descript-16 text-gray-500 whitespace-pre-line line-clamp-5">
          {truncateText(event.description, 214)}
        </p>
      </div>
    </Link>
  );
};

export default EventCard;

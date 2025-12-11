"use client";

import Image from "next/image";
import Link from "next/link";

import { getImageUrl } from "@/app/retreats/retreats/[slug]/helpers";

import { truncateText } from "../helpers";
import { OrganizerEvent } from "../types";

interface EventCardProps {
  event: OrganizerEvent;
  project: "retreats" | "workshops";
}

const EventCard = ({ event, project }: EventCardProps) => {
  return (
    <Link
      href={
        project === "retreats"
          ? `${process.env.NEXT_PUBLIC_RETREATS_HOST}/retreats/${event.slug}`
          : `${process.env.NEXT_PUBLIC_WORKSHOPS_HOST}/workshops/${event.slug}`
      }
    >
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

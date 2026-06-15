"use client";

import { Calendar, Clock, MapPin, Monitor } from "lucide-react";
import Link from "next/link";
import React from "react";

import { WyImage } from "@/components/custom/WyImage";
import { getCurrencySymbol } from "@/lib/currency";
import { formatDateRange } from "@/lib/formatDateRange";
import { renderShortLocation } from "@/lib/renderLocation";
import { cn } from "@/lib/utils";

import { Event } from "../retreats/types";

interface CourseCardEvent extends Event {
  is_teacher_training?: boolean | null;
  total_hours?: number | null;
  certification?: {
    type: string;
    designation?: string | null;
  } | null;
}

interface CourseCardProps {
  event: CourseCardEvent;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({ event, className }) => {
  const displayLocationTitle = renderShortLocation(event.location);
  const coverImage = event.image_ids?.[0];
  const certDesignation =
    event.certification?.type === "recognized" ? event.certification?.designation : null;

  return (
    <Link
      href={`/kursy/${event.slug}`}
      className={cn(
        "box-border flex flex-col items-start p-5 md:p-[22px] gap-4 w-full bg-white md:border-[4px] md:border-gray-50 md:shadow-[0px_8px_16px_8px_#FAFAFA] md:rounded-[22px] hover:shadow-md transition-shadow",
        className,
      )}
    >
      {/* Image */}
      {coverImage ? (
        <div className="w-full h-48 rounded-lg overflow-hidden">
          <WyImage
            src={coverImage}
            alt={event.title}
            width={400}
            height={200}
            className="object-cover w-full h-full"
          />
        </div>
      ) : null}

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        {event.is_teacher_training && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            Teacher Training
          </span>
        )}
        {certDesignation && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
            {certDesignation.replace("_", "-")}
          </span>
        )}
        {event.is_online && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            Online
          </span>
        )}
        {event.is_onsite && !event.is_online && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            Stacjonarny
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base md:text-lg font-semibold text-gray-900 leading-snug line-clamp-2">
        {event.title}
      </h3>

      {/* Meta info */}
      <div className="flex flex-col gap-1.5 text-sm text-gray-600 w-full">
        {event.start_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{formatDateRange(event.start_date, event.end_date)}</span>
          </div>
        )}
        {event.total_hours != null && event.total_hours > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{event.total_hours}h programu</span>
          </div>
        )}
        {displayLocationTitle && !event.is_online && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{displayLocationTitle}</span>
          </div>
        )}
        {event.is_online && !event.is_onsite && (
          <div className="flex items-center gap-1.5">
            <Monitor className="w-4 h-4 shrink-0" />
            <span>Online</span>
          </div>
        )}
      </div>

      {/* Price */}
      {event.price != null && (
        <div className="mt-auto pt-2 w-full border-t border-gray-100">
          <span className="text-lg font-bold text-gray-900">
            {event.price} {getCurrencySymbol(event.currency)}
          </span>
        </div>
      )}
    </Link>
  );
};

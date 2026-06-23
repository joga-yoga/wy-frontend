import { Calendar, Clock, ImageOff } from "lucide-react";
import React from "react";

import { WyImage } from "@/components/custom/WyImage";
import CustomOnlineIcon from "@/components/icons/CustomOnlineIcon";
import { getCurrencySymbol } from "@/lib/currency";
import { formatDateStartFull } from "@/lib/formatDateRange";
import { renderShortLocation } from "@/lib/renderLocation";
import { cn } from "@/lib/utils";

import { Event } from "../retreats/types";

export interface CourseCardEvent extends Event {
  is_teacher_training?: boolean | null;
  total_hours?: number | null;
}

interface CourseCardProps {
  event: CourseCardEvent;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({ event, className }) => {
  const displayLocationTitle = renderShortLocation(event.location);
  const coverImage = event.image_ids?.[0];

  return (
    <div
      className={cn(
        "box-border flex flex-col items-start p-5 md:p-[22px] gap-4 md:gap-[22px] w-full md:bg-white md:border-[4px] md:border-gray-50 md:shadow-[0px_8px_16px_8px_#FAFAFA] md:rounded-[22px]",
        className,
      )}
    >
      {/* Date + Course badge row */}
      <div className="flex flex-row items-center gap-2 md:gap-4 w-full h-[32px] md:h-[55px] self-stretch">
        <div className="flex flex-row justify-center items-center bg-gray-100 px-4 py-0.5 md:py-1.5 rounded-[4px] gap-2 md:gap-3">
          <Calendar className="w-[28px] h-[28px]" />
          <span className="text-xl md:text-2xl font-medium text-black whitespace-nowrap leading-1 md:pt-[2px]">
            {formatDateStartFull(event.start_date)}
          </span>
        </div>
        <div className="flex-grow" />
        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 md:py-1.5 rounded-[4px]">
          <img
            src="/images/logo/logo-courses.png"
            className="w-5 h-5 md:w-6 md:h-6"
            alt=""
            aria-hidden="true"
          />
          <span className="text-sm md:text-base font-medium text-black">Kurs</span>
        </div>
      </div>

      {/* Image + location */}
      <div className="flex flex-col gap-[12px] w-full flex-shrink-0">
        <div className="relative w-full h-[220px] md:h-[300px] rounded-[11px] overflow-hidden">
          {coverImage ? (
            <WyImage
              src={coverImage}
              alt={event.title || "Course image"}
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
            />
          ) : (
            <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
              <ImageOff className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex flex-row justify-between items-center w-full">
          <p className="text-sub-descript-18 md:text-descr-under-big-head text-gray-500">
            {displayLocationTitle ?? null}
          </p>
          {event.is_online ? (
            <CustomOnlineIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-500" />
          ) : null}
        </div>
      </div>

      {/* Title + description */}
      <div className="flex flex-col gap-[20px] w-full">
        <div className="flex flex-col items-start gap-2 md:gap-3 w-full">
          <h2 className="text-m-subtitle md:text-h-middle text-gray-800 self-stretch line-clamp-2">
            {event.title}
          </h2>
          <p className="text-m-descript md:text-descrip-under-header text-gray-500 self-stretch line-clamp-3 sm:line-clamp-4 md:line-clamp-5">
            {event.description}
          </p>
        </div>

        {/* Badges + price */}
        <div className="flex flex-row justify-between items-center w-full gap-2">
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {event.is_teacher_training && (
              <span className="text-xs md:text-sm font-medium px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Kurs nauczycielski
              </span>
            )}
            {event.total_hours != null && event.total_hours > 0 && (
              <span className="flex items-center gap-1 text-xs md:text-sm font-medium px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-gray-100 text-gray-700">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                {event.total_hours}h
              </span>
            )}
          </div>
          {event.price != null && event.price > 0 && (
            <div className="flex flex-col justify-center items-end shrink-0">
              <span className="text-sub-descript-18 md:text-middle-header-22 text-right text-gray-700">
                {`od ${event.price} ${getCurrencySymbol(event.currency)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

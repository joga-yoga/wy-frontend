"use client";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { ArrowLeft, ArrowRight, Calendar, ImageOff } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

import { getImageUrl } from "@/app/retreats/retreats/[retreatId]/helpers";
import { BookmarkButton } from "@/components/custom/BookmarkButton";
import { PREDEFINED_TAGS } from "@/components/custom/TagsSelect";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { formatDateStart } from "@/lib/formatDateRange";
import { renderShortLocation } from "@/lib/renderLocation";
import { cn } from "@/lib/utils";

import { Event } from "../retreats/types";

interface WorkshopCardProps {
  event: Event;
}

export const WorkshopCard: React.FC<WorkshopCardProps> = ({ event }) => {
  const { bookmarkedEventIds, addBookmark, removeBookmark } = useEventsFilter();

  const displayLocationTitle = renderShortLocation(event.location);

  const [hidePrev, setHidePrev] = useState(true);
  const [hideNext, setHideNext] = useState(!(event.image_ids && event.image_ids.length > 1));

  const [isBookmarkedLocal, setIsBookmarkedLocal] = useState(bookmarkedEventIds.includes(event.id));

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newBookmarkState = !isBookmarkedLocal;
    setIsBookmarkedLocal(newBookmarkState);
    if (newBookmarkState) {
      addBookmark(event.id);
    } else {
      removeBookmark(event.id);
    }
  };

  const updateNavVisibility = (swiper: SwiperClass) => {
    setHidePrev(swiper.isBeginning);
    setHideNext(swiper.isEnd);
  };

  const prevButtonClass = `event-swiper-prev-${event.id}`;
  const nextButtonClass = `event-swiper-next-${event.id}`;

  return (
    <div className="box-border flex flex-col items-start p-5 md:p-[22px] gap-4 md:gap-[22px] w-full md:bg-white md:border-[4px] md:border-gray-50 md:shadow-[0px_8px_16px_8px_#FAFAFA] md:rounded-[22px]">
      <div className="flex flex-row items-center p-0 gap-2 md:gap-4 w-full h-[32px] md:h-[55px] self-stretch">
        <div className="flex flex-row justify-center items-center p-0 bg-gray-100 px-4 md:px-4 py-0.5 md:py-1.5 rounded-[4px] gap-2 md:gap-3">
          <Calendar className="w-[28px] h-[28px] md:w-[28px] md:h-[28px]" />
          <span className="text-subheader md:text-h-middle text-black whitespace-nowrap leading-1 md:pt-[2px]">
            {formatDateStart(event.start_date)}
          </span>
        </div>
        <div className="flex-grow"></div>
        <BookmarkButton
          isActive={isBookmarkedLocal}
          toggleHandler={handleBookmarkClick}
          size="small"
          variant="black"
        />
      </div>
      <div className="flex flex-col items-start md:items-center p-0 gap-6 w-full self-stretch">
        <div className="flex flex-col gap-[12px] w-full md:min-w-[420px] flex-shrink-0">
          <div className="relative w-full h-[220px] md:h-[300px] rounded-[11px] overflow-hidden">
            {event.image_ids && event.image_ids.length > 0 ? (
              <Swiper
                modules={[Navigation]}
                spaceBetween={0}
                slidesPerView={1}
                navigation={{
                  prevEl: `.${prevButtonClass}`,
                  nextEl: `.${nextButtonClass}`,
                }}
                pagination={false}
                className="h-full w-full"
                loop={false}
                onSwiper={updateNavVisibility}
                onSlideChange={updateNavVisibility}
              >
                {event.image_ids.map((imageId) => (
                  <SwiperSlide key={imageId} className="h-full w-full">
                    <div className="relative h-full w-full">
                      <Image
                        src={getImageUrl(imageId)}
                        alt={event.title || "Event image"}
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
                <ImageOff className="w-16 h-16 text-gray-400" />
              </div>
            )}
            {event.image_ids && event.image_ids.length > 1 && (
              <>
                <button
                  className={`${prevButtonClass} absolute top-1/2 left-3 -translate-y-1/2 z-10 bg-white rounded-full p-1 md:p-2 shadow-md hover:bg-gray-100 transition-opacity duration-300 ${hidePrev ? "opacity-0" : "opacity-100"}`}
                >
                  <ArrowLeft className="h-6 w-6 md:h-6 md:w-6 text-gray-700" />
                </button>
                <button
                  className={`${nextButtonClass} absolute top-1/2 right-3 -translate-y-1/2 z-10 bg-white rounded-full p-1 md:p-2 shadow-md hover:bg-gray-100 transition-opacity duration-300 ${hideNext ? "opacity-0" : "opacity-100"}`}
                >
                  <ArrowRight className="h-6 w-6 md:h-6 md:w-6 text-gray-700" />
                </button>
              </>
            )}
          </div>
          {displayLocationTitle && (
            <p className="text-sub-descript-18 md:text-descr-under-big-head text-gray-500">
              {displayLocationTitle}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-[20px] w-full">
          <div className="flex flex-col items-start gap-2 md:gap-3 w-full">
            <h2 className="text-m-subtitle md:text-h-middle text-gray-800 self-stretch line-clamp-2">
              {event.title || "Tytuł Wyjazdu"}
            </h2>
            <p className="text-m-descript md:text-descrip-under-header text-gray-500 self-stretch line-clamp-3 sm:line-clamp-4 md:line-clamp-5">
              {event.description || "Brak opisu."}
            </p>
          </div>
          {/* <div className="flex-grow"></div> */}
          <div className="flex flex-row justify-between items-center w-full">
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-row justify-start items-center w-full gap-2">
                {event.tags.slice(0, 3).map((tag) => {
                  const Icon = PREDEFINED_TAGS.find((t) => t.id === tag)?.icon || null;
                  const label = PREDEFINED_TAGS.find((t) => t.id === tag)?.label || null;
                  if (!Icon) return null;

                  return (
                    <Tooltip key={tag} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Icon
                          key={tag}
                          className={cn("h-6 w-6 md:h-8 md:w-8 flex-shrink-0 text-gray-600")}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col justify-center items-end w-full self-stretch gap-0">
              <div className="flex flex-row justify-end items-center w-full">
                <span className="text-sub-descript-18 md:text-middle-header-22 text-right text-gray-700 flex-grow">
                  {event.price !== null
                    ? `od ${event.price} ${event.currency || "PLN"} / osobę`
                    : "Cena N/A"}
                </span>
              </div>
              {/* {event.price !== null && event.start_date && (
              <div className="flex flex-row justify-end items-center w-full h-[22px]">
                <span className="text-m-sunscript-font md:text-sub-descript-18 text-gray-400 text-right flex-grow">
                  {calculatePricePerDay(event.price, event.start_date, event.end_date)}
                </span>
              </div>
            )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

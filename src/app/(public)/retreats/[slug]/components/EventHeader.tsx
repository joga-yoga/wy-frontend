"use client";

import { ShareIcon } from "lucide-react";
import React from "react";

import { BookmarkButton } from "@/components/custom/BookmarkButton";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { cn } from "@/lib/utils";

interface EventHeaderProps {
  title: string;
  eventId: string;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ title, eventId }) => {
  const { bookmarkedEventIds, addBookmark, removeBookmark } = useEventsFilter();
  const isBookmarked = bookmarkedEventIds.includes(eventId);

  const handleBookmarkClick = () => {
    if (isBookmarked) {
      removeBookmark(eventId);
    } else {
      addBookmark(eventId);
    }
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out this event: ${title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Could not copy text: ", err);
      }
    }
  };

  return (
    <section aria-labelledby="event-title-and-images">
      <div className="flex justify-between items-start gap-2 md:gap-5">
        <h1
          id="event-title-and-images"
          className="text-sub-descript-18 md:text-h-middle text-gray-700 max-w-3xl"
        >
          {title}
        </h1>
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={handleShareClick}
            className={cn(
              "flex items-center justify-center bg-gray-100 rounded-full",
              "h-8 w-8 md:h-10 md:w-10",
              "hover:bg-gray-200 duration-200",
            )}
          >
            <ShareIcon className="w-4 h-4 md:w-6 md:h-6 stroke-2 md:stroke-[1.5px]" />
          </button>
          <BookmarkButton
            isActive={isBookmarked}
            toggleHandler={handleBookmarkClick}
            size="small"
          />
        </div>
      </div>
    </section>
  );
};

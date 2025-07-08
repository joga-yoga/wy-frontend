"use client";

import { ShareIcon } from "lucide-react";
import React from "react";

import ActiveBookmarkIcon from "@/components/icons/ActiveBookmarkIcon";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import { useEventsFilter } from "@/context/EventsFilterContext";

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
        <div className="flex items-center gap-1 md:gap-3">
          <div className="w-[32px] h-[32px] md:w-[44px] md:h-[44px] flex items-center justify-center bg-gray-600 rounded-full">
            <button onClick={handleShareClick} className="text-white">
              <ShareIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <div className="w-[32px] h-[32px] md:w-[44px] md:h-[44px] flex items-center justify-center">
            <button onClick={handleBookmarkClick} aria-label="Toggle bookmark" className="p-2">
              {isBookmarked ? (
                <ActiveBookmarkIcon className="w-[32px] h-[32px] md:w-[44px] md:h-[44px] text-brand-green" />
              ) : (
                <BookmarkIcon className="w-[32px] h-[32px] md:w-[44px] md:h-[44px] cursor-pointer" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

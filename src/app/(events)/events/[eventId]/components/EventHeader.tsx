"use client";

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
      <div className="flex justify-between items-start">
        <h1 id="event-title-and-images" className="text-h-middle text-gray-700 max-w-3xl">
          {title}
        </h1>
        <div className="flex items-center gap-5">
          <button onClick={handleShareClick} className="text-gray-500 text-middle-header-22">
            Share
          </button>
          <div className="w-[44px] h-[44px] flex items-center justify-center">
            <button onClick={handleBookmarkClick} aria-label="Toggle bookmark" className="p-2">
              {isBookmarked ? (
                <ActiveBookmarkIcon className="w-7 h-7 sm:w-9 sm:h-9 text-brand-green" />
              ) : (
                <BookmarkIcon className="w-7 h-7 sm:w-9 sm:h-9 cursor-pointer" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

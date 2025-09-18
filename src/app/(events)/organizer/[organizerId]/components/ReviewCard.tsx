"use client";

import Image from "next/image";
import React from "react";

import { getImageUrl } from "@/app/(events)/events/[eventId]/helpers";
import { OrganizerReview } from "@/app/(events)/organizer/[organizerId]/types";
import { BookmarkButton } from "@/components/custom/BookmarkButton";
import { formatTimeAgo } from "@/lib/formatDateRange";

interface ReviewCardProps {
  review: OrganizerReview;
  image?: string;
  className?: string;
}

const ReviewCard = ({ review, image, className = "w-full max-w-[402px]" }: ReviewCardProps) => {
  const normalizedRating = Math.max(0, Math.min(5, Math.floor(review.rating)));

  return (
    <div className={`${className} flex flex-col items-start`}>
      {/* Автор */}
      <div className="flex w-full items-center gap-2.5 mt-5 mb-5">
        <div className="relative w-[44px] h-[44px] rounded-full overflow-hidden shrink-0">
          <Image
            src={getImageUrl(image, 0)}
            alt={review.author}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <p className="text-m-header md:text-m-header">{review.author}</p>
          <p className="text-m-descript md:text-m-sunscript-font text-gray-500">
            {formatTimeAgo(review.created_at)}
          </p>
        </div>
      </div>

      {/* Рейтинг */}
      <div className="mb-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const isBlack = i < normalizedRating;
          return (
            <BookmarkButton
              key={i}
              isActive={false}
              variant={isBlack ? "black" : "default"}
              size="xs"
              toggleHandler={() => {}}
              className="pointer-events-none"
            />
          );
        })}
      </div>

      {/* Текст */}
      <div className="text-m-descript md:text-m-sunscript-font text-gray-500 break-words line-clamp-6">
        {review.review_text}
      </div>
    </div>
  );
};

export default ReviewCard;

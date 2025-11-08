"use client";

import React from "react";

import { BookmarkButton } from "@/components/custom/BookmarkButton";
import { formatTimeAgo } from "@/lib/formatDateRange";

import { OrganizerReview } from "../types";

interface ReviewCardProps {
  review: OrganizerReview;
  image?: string;
  className?: string;
}

const ReviewCard = ({ review, image, className = "w-full max-w-[402px]" }: ReviewCardProps) => {
  const normalizedRating = review.rating ? Math.max(0, Math.min(5, Math.floor(review.rating))) : 0;
  const reviewText = review.text_translated || review.text || "";
  const authorName = review.author_name || "Anonymous";

  return (
    <div className={`${className} flex flex-col items-start`}>
      <div className="flex w-full items-center gap-2.5 mt-5 mb-5">
        <div className="relative w-[44px] h-[44px] rounded-full overflow-hidden shrink-0">
          <img
            src={review.author_photo || ""}
            alt={authorName}
            className="rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <p className="text-m-header md:text-m-header">{authorName}</p>
          <p className="text-m-descript md:text-m-sunscript-font text-gray-500">
            {formatTimeAgo(review.date_iso)}
          </p>
        </div>
      </div>

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

      <div className="text-m-descript md:text-m-sunscript-font text-gray-500 break-words line-clamp-6">
        {reviewText}
      </div>
    </div>
  );
};

export default ReviewCard;

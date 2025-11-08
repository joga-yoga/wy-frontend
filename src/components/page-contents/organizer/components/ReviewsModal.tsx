"use client";

import { Loader2, XIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { axiosInstance } from "@/lib/axiosInstance";

import { OrganizerReview } from "../types";
import ReviewCard from "./ReviewCard";

interface ReviewsModalProps {
  placeId: string;
  title: string;
  image?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialReviews?: OrganizerReview[];
  initialHasMore: boolean;
}

interface PaginatedReviewsResponse {
  reviews: OrganizerReview[];
  total_count: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export const ReviewsModal = ({
  placeId,
  image,
  isOpen,
  title,
  onOpenChange,
  initialReviews = [],
  initialHasMore = false,
}: ReviewsModalProps) => {
  const [reviews, setReviews] = useState<OrganizerReview[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const LIMIT = 10;

  const loadReviews = useCallback(
    async (newOffset: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get<PaginatedReviewsResponse>(
          `/organizer/reviews/${placeId}`,
          {
            params: {
              offset: newOffset,
              limit: LIMIT,
            },
          },
        );
        console.log("🚀 ~ ReviewsModal ~ response.data:", response.data);

        if (newOffset === 0) {
          // Initial load or refresh
          setReviews(response.data.reviews);
        } else {
          // Load more
          setReviews((prev) => [...prev, ...response.data.reviews]);
        }

        setOffset(newOffset + LIMIT);
        console.log("🚀 ~ ReviewsModal ~ response.data.has_more:", response.data.has_more);
        setHasMore(response.data.has_more);
      } catch (err) {
        console.error("Failed to load reviews:", err);
        setError("Failed to load reviews. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [placeId],
  );

  // Load initial reviews when modal opens
  useEffect(() => {
    if (isOpen && !hasInitialized && initialReviews.length === 0) {
      loadReviews(0);
      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized, initialReviews.length, loadReviews]);

  const handleLoadMore = () => {
    loadReviews(offset);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-[90%] md:max-w-[800px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="sticky top-0 bg-white z-20 px-6 py-4 border-b rounded-t-lg">
          <DialogTitle className="text-left pr-8">{title}</DialogTitle>

          <DialogClose className="absolute top-2 right-2 rounded-full p-1.5 bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 transition">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 pr-4">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">{error}</div>}

          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                image={image}
                className="w-full max-w-[700px]"
              />
            ))}
          </div>

          {reviews.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-8">No reviews available</div>
          )}
          {(hasMore || isLoading) && (
            <div className="flex justify-center py-4">
              <Button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Poraź więcej"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

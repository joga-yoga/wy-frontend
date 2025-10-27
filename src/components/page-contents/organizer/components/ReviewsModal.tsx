"use client";

import { XIcon } from "lucide-react";
import React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { OrganizerReview } from "../types";
import ReviewCard from "./ReviewCard";

interface ReviewsModalProps {
  reviews: OrganizerReview[];
  title: string;
  image?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReviewsModal = ({
  reviews,
  image,
  isOpen,
  title,
  onOpenChange,
}: ReviewsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="
      mx-auto
      max-w-[90%]
      md:max-w-[800px]
      h-[90vh]
      flex flex-col
      p-0
        "
      >
        <DialogHeader className="sticky top-0 bg-white z-20 px-6 py-4 border-b rounded-t-lg">
          <DialogTitle className="text-left pr-8">{title}</DialogTitle>

          <DialogClose
            className="
      absolute top-2 right-2
      rounded-full p-1.5
      bg-secondary text-secondary-foreground
      shadow-md
      hover:bg-secondary/80
      transition
    "
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 pr-4">
          <div className="flex flex-col gap-4">
            {reviews.map((review, index) => (
              <ReviewCard
                key={index}
                review={review}
                image={image}
                className="w-full max-w-[700px]"
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

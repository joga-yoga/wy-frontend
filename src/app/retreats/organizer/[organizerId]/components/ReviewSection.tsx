"use client";

import { useState } from "react";

import { Carousel } from "@/app/retreats/organizer/[organizerId]/components/Carousel";
import ReviewCard from "@/app/retreats/organizer/[organizerId]/components/ReviewCard";
import { ReviewsModal } from "@/app/retreats/organizer/[organizerId]/components/ReviewsModal";
import { OrganizerReview } from "@/app/retreats/organizer/[organizerId]/types";
import { Button } from "@/components/ui/button";

interface ReviewSectionProps {
  title: string;
  reviews: OrganizerReview[];
  image?: string;
}

export const ReviewSection = ({ title, reviews, image }: ReviewSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Carousel
        title={title}
        items={reviews}
        renderItem={(review) => <ReviewCard review={review} image={image} />}
        image={image}
      />
      <Button
        className="
          w-[180px] h-[45px]
          flex items-center justify-center gap-[10px]
          rounded-[8px] bg-[#F2F2F3]
          opacity-100
          md:text-m-sunscript-font text-m-header
          hover:bg-gray-600/90 hover:text-white
        "
        onClick={() => setIsModalOpen(true)}
      >
        Poraż więcej
      </Button>

      <ReviewsModal
        reviews={reviews}
        image={image}
        title={title}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};

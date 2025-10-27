"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { OrganizerReview } from "../types";
import { Carousel } from "./Carousel";
import ReviewCard from "./ReviewCard";
import { ReviewsModal } from "./ReviewsModal";

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

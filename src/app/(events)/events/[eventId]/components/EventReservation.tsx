"use client";

import React, { useEffect, useRef, useState } from "react";

import useIsMobile from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

import { EventDetail } from "../types";
import { ReservationBox } from "./ReservationBox";
import { ReservationModal } from "./ReservationModal";

interface EventReservationProps {
  event: EventDetail;
}

export const EventReservation: React.FC<EventReservationProps> = ({ event }) => {
  const isMobile = useIsMobile();
  const [showFixed, setShowFixed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) {
      setShowFixed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFixed(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isMobile]);

  const handleReserveClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div ref={ref} className="hidden md:block">
        <ReservationBox
          startDate={event.start_date}
          endDate={event.end_date}
          className="border border-gray-100 rounded-t-[20px] rounded-b-[4px]"
          onReserveClick={handleReserveClick}
        />
      </div>

      {showFixed && (
        <div
          className={cn(
            "fixed bottom-0 right-0 md:right-[32px] z-50",
            "w-full md:w-[400px] rounded-t-[20px]",
            "border-t border-gray-100 md:border-x",
            "bg-white",
            showFixed ? "block" : "block md:hidden",
          )}
        >
          <ReservationBox
            startDate={event.start_date}
            endDate={event.end_date}
            onReserveClick={handleReserveClick}
          />
        </div>
      )}
      <ReservationModal event={event} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

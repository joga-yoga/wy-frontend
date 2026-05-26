"use client";

import React, { useEffect, useRef, useState } from "react";

import useIsMobile from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

import { EventDetail } from "../types";
import { ReservationBox } from "./ReservationBox";
import { ReservationModal } from "./ReservationModal";

interface EventReservationProps {
  event: EventDetail;
  project: "retreats" | "workshops";
}

export const EventReservation: React.FC<EventReservationProps> = ({ event, project }) => {
  const isMobile = useIsMobile();
  const [showFixed, setShowFixed] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
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

  useEffect(() => {
    if (showFixed) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showFixed]);

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
          project={project}
        />
      </div>

      {isRendered && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "flex justify-end w-full mx-auto container-wy md:pr-[32px]",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-2",
          )}
          data-state={showFixed ? "open" : "closed"}
        >
          <div
            className={cn(
              "w-full md:w-[400px] rounded-t-[20px]",
              "border-t border-gray-100 md:border-x",
              "bg-white",
            )}
          >
            <ReservationBox
              startDate={event.start_date}
              endDate={event.end_date}
              onReserveClick={handleReserveClick}
              project={project}
            />
          </div>
        </div>
      )}
      <ReservationModal
        event={event}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        project={project}
      />
    </>
  );
};

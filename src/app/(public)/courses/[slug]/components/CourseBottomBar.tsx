"use client";

import React, { useState } from "react";

import { ReservationModal } from "@/app/(public)/retreats/[slug]/components/ReservationModal";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from "@/lib/currency";

import { CourseEventDetail } from "../types";

interface CourseBottomBarProps {
  event: CourseEventDetail;
}

export const CourseBottomBar: React.FC<CourseBottomBarProps> = ({ event }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!event.price) return null;

  const formattedPrice = event.price.toLocaleString("pl-PL");
  const currency = getCurrencySymbol(event.currency);

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_16px_0_rgba(0,0,0,0.06)]">
        <div className="container-wy mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight">
              {formattedPrice} {currency}
            </p>
            {event.deposit_amount != null && (
              <p className="text-sm text-gray-500 leading-tight truncate">
                zadatek {event.deposit_amount.toLocaleString("pl-PL")} {currency}
              </p>
            )}
          </div>
          <Button
            variant="cta"
            size="cta"
            className="shrink-0"
            onClick={() => setIsModalOpen(true)}
          >
            Zapisz się
          </Button>
        </div>
      </div>
      <ReservationModal
        event={event}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        project="workshops"
      />
    </>
  );
};

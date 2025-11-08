import React from "react";

import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import { formatDateRange, formatDateTimeRange } from "@/lib/formatDateRange";
import { scrollTo } from "@/lib/scrollTo";
import { cn } from "@/lib/utils";

interface ReservationBoxProps {
  project: "retreats" | "workshops";
  startDate: string;
  endDate: string | null;
  className?: string;
  onReserveClick: () => void;
}

export const ReservationBox: React.FC<ReservationBoxProps> = ({
  project,
  startDate,
  endDate,
  className,
  onReserveClick,
}) => {
  const isMobile = useIsMobile();
  return (
    <div className={className}>
      <div className="px-5 py-5 md:py-8">
        <div className="flex justify-between items-center">
          <div>
            <p
              className={cn(
                "font-medium",
                project === "retreats" ? "text-h-small md:text-descr-under-big-head" : "text-xl",
              )}
            >
              {project === "retreats"
                ? formatDateRange(startDate, endDate)
                : formatDateTimeRange(startDate, endDate)}
            </p>
            <span
              onClick={() =>
                scrollTo(
                  isMobile ? "cancellation-policy-mobile" : "cancellation-policy",
                  isMobile ? 72 + 20 : undefined,
                )
              }
              className="text-m-sunscript-font md:text-sub-descript-18 text-gray-500 underline cursor-pointer"
            >
              Zasady anulacji
            </span>
          </div>
          <Button variant="cta" size="cta" onClick={onReserveClick}>
            Rezerwacja
          </Button>
        </div>
      </div>
    </div>
  );
};

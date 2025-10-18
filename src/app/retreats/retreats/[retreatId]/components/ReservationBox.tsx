import React from "react";

import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import { formatDateRange } from "@/lib/formatDateRange";
import { scrollTo } from "@/lib/scrollTo";

interface ReservationBoxProps {
  startDate: string;
  endDate: string | null;
  className?: string;
  onReserveClick: () => void;
}

export const ReservationBox: React.FC<ReservationBoxProps> = ({
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
            <p className="text-h-small md:text-descr-under-big-head font-medium">
              {formatDateRange(startDate, endDate)}
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

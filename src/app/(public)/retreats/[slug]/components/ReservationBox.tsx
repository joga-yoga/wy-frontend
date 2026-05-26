import { Clock } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import { formatDateRange, formatDateTimeRange, formatDurationInHours } from "@/lib/formatDateRange";
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
            {project === "retreats" ? (
              <>
                <p className={cn("font-medium text-h-small md:text-descr-under-big-head")}>
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
              </>
            ) : (
              <>
                <p className="font-medium text-xl">{formatDateTimeRange(startDate)}</p>
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
              </>
            )}
          </div>
          <Button variant="cta" size="cta" onClick={onReserveClick}>
            Rezerwacja
          </Button>
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";

import Calendar from "@/app/(events)/components/filters-modal/components/FilterCalendar";
import FilterItem from "@/app/(events)/components/filters-modal/components/FilterItem";
import { PeriodSets } from "@/app/(events)/components/filters-modal/data";
import { formatDateRange } from "@/app/(events)/components/filters-modal/helpers";
import { PeriodSet } from "@/app/(events)/components/filters-modal/types";

interface PeriodSectionProps {
  startDateFrom?: string | null;
  startDateTo?: string | null;
  onDateSelect?: (from: string | null, to: string | null) => void;
  selectedPeriodSet?: PeriodSet | null;
  onPeriodSelect?: (periodSet: PeriodSet) => void;
}

export const PeriodSection = ({
  startDateFrom,
  startDateTo,
  onDateSelect,
  selectedPeriodSet,
  onPeriodSelect,
}: PeriodSectionProps) => {
  // Check if current dates match any existing period set
  const isExistingPeriodSet = PeriodSets.some(
    (periodSet) => startDateFrom === periodSet.start_date && startDateTo === periodSet.end_date,
  );

  // Show custom filter when both dates are set and don't match existing period sets
  const showCustomFilter = startDateFrom && startDateTo && !isExistingPeriodSet;

  // Format custom filter title
  const customFilterTitle = showCustomFilter ? formatDateRange(startDateFrom, startDateTo) : "";

  return (
    <div className="mx-7 my-11">
      <p className="text-sub-descript-18 md:text-descr-under-big-head">Termin wyjazdu</p>
      <div className="flex flex-wrap gap-x-[12px] gap-y-4 mt-5">
        {PeriodSets.map((periodSet) => (
          <FilterItem
            key={periodSet.name}
            title={periodSet.name}
            isSelected={selectedPeriodSet?.name === periodSet.name}
            onClick={() => onPeriodSelect?.(periodSet)}
          />
        ))}
        {showCustomFilter && (
          <FilterItem
            key="custom-period"
            title={customFilterTitle}
            isSelected={true}
            onClick={() => {
              onDateSelect?.(null, null);
            }}
          />
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-9 items-center md:justify-around">
        <Calendar
          startDateFrom={startDateFrom}
          startDateTo={startDateTo}
          onDateSelect={onDateSelect}
        />
      </div>
    </div>
  );
};

export default PeriodSection;

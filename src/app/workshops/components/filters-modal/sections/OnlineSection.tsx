"use client";

import FilterItem from "@/app/retreats/components/filters-modal/components/FilterItem";

import { WorkshopsFormat } from "../hooks/useFiltersState";

interface OnlineSectionProps {
  value: WorkshopsFormat;
  onChange: (value: WorkshopsFormat) => void;
}

const OnlineSection = ({ value, onChange }: OnlineSectionProps) => {
  return (
    <div className="mx-7 my-11">
      <p className="text-sub-descript-18 md:text-descr-under-big-head">Forma</p>
      <div className="flex flex-wrap gap-x-[12px] gap-y-4 mt-5">
        <FilterItem
          title="Wszystkie"
          isSelected={value === "all"}
          onClick={() => onChange("all")}
        />
        <FilterItem
          title="Online"
          isSelected={value === "online"}
          onClick={() => onChange("online")}
        />
        <FilterItem
          title="Stacjonarne"
          isSelected={value === "onsite"}
          onClick={() => onChange("onsite")}
        />
      </div>
    </div>
  );
};

export default OnlineSection;

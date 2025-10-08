"use client";

import React from "react";

import { FlagIcon } from "@/components/icons/react-flagkit";

interface FilterItemProps {
  title: string;
  countryCode?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const FilterItem = ({
  countryCode,
  title,
  isSelected = false,
  onClick,
}: FilterItemProps) => {
  return (
    <div
      className={`flex w-fit items-center h-[52px] gap-2 rounded-[26px] border px-3 cursor-pointer transition-colors ${
        isSelected ? "border-[#11C932]" : "border-[#A1A1AA]"
      }`}
      onClick={onClick}
    >
      {countryCode && (
        <FlagIcon
          country={countryCode}
          size={undefined}
          className="w-6 h-6 min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px] rounded-full object-cover border border-gray-300"
        />
      )}
      <p className="text-m-sunscript-font md:text-sub-descript-18 text-gray-500">{title}</p>
    </div>
  );
};

export default FilterItem;

"use client";

import React from "react";

import { FlagIcon } from "@/components/icons/react-flagkit";

interface FilterItemProps {
  title: string;
  countryCode?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

// Mapping country names to country codes for flag display
const getCountryCodeFromName = (countryName: string): string | undefined => {
  const countryMap: { [key: string]: string } = {
    Poland: "PL",
    Portugal: "PT",
    India: "IN",
    "Sri Lanka": "LK",
    Thailand: "TH",
    Spain: "ES",
    Italy: "IT",
    Indonesia: "ID",
    Croatia: "HR",
    Czechia: "CZ",
    Estonia: "EE",
    Latvia: "LV",
    Lithuania: "LT",
  };
  return countryMap[countryName];
};

export const FilterItem = ({
  countryCode,
  title,
  isSelected = false,
  onClick,
}: FilterItemProps) => {
  // Use provided countryCode or derive it from title
  const displayCountryCode = countryCode || getCountryCodeFromName(title);

  return (
    <div
      className={`flex w-fit items-center h-[52px] gap-2 rounded-[26px] border px-3 cursor-pointer transition-colors ${
        isSelected ? "border-[#11C932]" : "border-[#A1A1AA]"
      }`}
      onClick={onClick}
    >
      {displayCountryCode && (
        <FlagIcon
          country={displayCountryCode}
          size={undefined}
          className="w-6 h-6 min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px] rounded-full object-cover border border-gray-300"
        />
      )}
      <p className="text-m-sunscript-font md:text-sub-descript-18 text-gray-500">{title}</p>
    </div>
  );
};

export default FilterItem;

"use client";

import React from "react";

import { FlagIcon } from "@/components/icons/react-flagkit";
import { SelectionChip } from "@/components/ui/selection-chip";

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
    <SelectionChip
      selected={isSelected}
      onClick={onClick}
      icon={
        countryCode ? (
          <FlagIcon
            country={countryCode}
            size={undefined}
            className="h-5 w-5 rounded-full border border-gray-300 object-cover"
          />
        ) : undefined
      }
    >
      {title}
    </SelectionChip>
  );
};

export default FilterItem;

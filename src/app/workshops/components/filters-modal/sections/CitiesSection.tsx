"use client";

import FilterItem from "@/app/retreats/components/filters-modal/components/FilterItem";

import { WorkshopsFilterInitialData } from "../hooks/useFilterInitialData";

interface CitiesSectionProps {
  initialData: WorkshopsFilterInitialData | null | undefined;
  selectedCityName: string | null;
  onSelect: (cityName: string) => void;
}

const CitiesSection = ({ initialData, selectedCityName, onSelect }: CitiesSectionProps) => {
  const cities = initialData?.cities || [];

  if (!cities.length) return null;

  return (
    <div className="mx-7 my-11">
      <p className="text-sub-descript-18 md:text-descr-under-big-head">Miasto</p>
      <div className="flex flex-wrap gap-x-[12px] gap-y-4 mt-5">
        {cities.map((city) => (
          <FilterItem
            key={city.name}
            title={city.name}
            isSelected={selectedCityName === city.name}
            onClick={() => onSelect(city.name)}
          />
        ))}
      </div>
    </div>
  );
};

export default CitiesSection;

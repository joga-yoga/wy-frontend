"use client";

import FilterItem from "@/app/(events)/components/filters-modal/components/FilterItem";

interface CountriesSectionProps {
  selectedCountryName?: string | null;
  onCountrySelect?: (countryName: string) => void;
  countries?: string[];
}

export const CountriesSection = ({
  selectedCountryName,
  onCountrySelect,
  countries,
}: CountriesSectionProps) => {
  if (!countries) return null;

  return (
    <div className="mx-7 my-11">
      <p className="text-sub-descript-18 md:text-descr-under-big-head">Lokalizacja</p>
      <div className="flex flex-wrap gap-x-[12px] gap-y-4 mt-5">
        {countries.map((country) => (
          <FilterItem
            key={country}
            title={country}
            isSelected={selectedCountryName === country}
            onClick={() => onCountrySelect?.(country)}
          />
        ))}
      </div>
    </div>
  );
};

export default CountriesSection;

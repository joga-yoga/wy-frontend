"use client";

import { XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useFilterInitialData } from "@/app/(events)/components/filters-modal/hooks/useFilterInitialData";
import { useFiltersState } from "@/app/(events)/components/filters-modal/hooks/useFiltersState";
import { useFilterValidation } from "@/app/(events)/components/filters-modal/hooks/useFilterValidation";
import CountriesSection from "@/app/(events)/components/filters-modal/sections/CountriesSection";
import LanguagesSection from "@/app/(events)/components/filters-modal/sections/LaguageSection";
import PeriodSection from "@/app/(events)/components/filters-modal/sections/PeriodSection";
import PriceSection from "@/app/(events)/components/filters-modal/sections/PriceSection";
import { PeriodSet } from "@/app/(events)/components/filters-modal/types";
import { buildFilterUrl } from "@/app/(events)/components/filters-modal/utils/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FiltersModalProps {
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FiltersModal = ({ isOpen, title, onOpenChange }: FiltersModalProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: initialData, loading: initialDataLoading } = useFilterInitialData(isOpen);

  const initialFiltersFromUrl = useMemo(() => {
    if (!isOpen) return null;

    return {
      selectedCountryName: searchParams.get("country"),
      startDateFrom: searchParams.get("start_date_from"),
      startDateTo: searchParams.get("start_date_to"),
      priceMin: searchParams.get("price_min") ? Number(searchParams.get("price_min")) : null,
      priceMax: searchParams.get("price_max") ? Number(searchParams.get("price_max")) : null,
      selectedLanguageCode: searchParams.get("language"),
      selectedPeriodSet: null,
    };
  }, [searchParams, isOpen]);

  const { filters, setters, actions, serverData } = useFiltersState(
    initialData,
    initialFiltersFromUrl,
  );
  const validation = useFilterValidation(filters.priceMin, filters.priceMax);

  const applyFilters = () => {
    const filterUrl = buildFilterUrl(filters, serverData.serverPriceMin, serverData.serverPriceMax);
    router.push(filterUrl);
    onOpenChange(false);
  };

  const handleCountrySelect = (countryName: string) => {
    validation.resetPricesIfInvalid(setters.setPriceMin, setters.setPriceMax);
    const newValue = countryName === filters.selectedCountryName ? null : countryName;
    setters.setSelectedCountryName(newValue);
  };

  const handleDateSelect = (from: string | null, to: string | null) => {
    validation.resetPricesIfInvalid(setters.setPriceMin, setters.setPriceMax);
    setters.setStartDateFrom(from);
    setters.setStartDateTo(to);
  };

  const handlePriceSelect = (min: number, max: number) => {
    setters.setPriceMin(min);
    setters.setPriceMax(max);
  };

  const handlePriceInputChange = (min: number | null, max: number | null) => {
    setters.setPriceMin(min);
    setters.setPriceMax(max);
  };

  const handleLanguageSelect = (languageCode: string) => {
    validation.resetPricesIfInvalid(setters.setPriceMin, setters.setPriceMax);
    const newValue = languageCode === filters.selectedLanguageCode ? null : languageCode;
    setters.setSelectedLanguageCode(newValue);
  };

  const handlePeriodSelect = (periodSet: PeriodSet) => {
    validation.resetPricesIfInvalid(setters.setPriceMin, setters.setPriceMax);

    if (filters.selectedPeriodSet?.name === periodSet.name) {
      actions.resetPeriodToDefault();
    } else {
      setters.setSelectedPeriodSet(periodSet);
      setters.setStartDateFrom(periodSet.start_date);
      setters.setStartDateTo(periodSet.end_date);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="
    mx-auto
    max-w-[90%]
    md:max-w-[710px]
    h-[90vh]
    flex flex-col
    p-0
     gap-0
  "
      >
        <DialogHeader className="relative h-[82px] bg-white z-20 px-6 border-b rounded-t-lg flex items-center justify-center">
          <DialogTitle className="text-center">{title}</DialogTitle>

          <DialogClose className="absolute right-5 top-1/2 -translate-y-1/2 p-0">
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4">
          <CountriesSection
            selectedCountryName={filters.selectedCountryName}
            onCountrySelect={handleCountrySelect}
            countries={initialData?.countries}
          />
          <hr />
          <PeriodSection
            startDateFrom={filters.startDateFrom}
            startDateTo={filters.startDateTo}
            onDateSelect={handleDateSelect}
            selectedPeriodSet={filters.selectedPeriodSet}
            onPeriodSelect={handlePeriodSelect}
          />
          <hr />
          <PriceSection
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            serverPriceMin={serverData?.serverPriceMin}
            serverPriceMax={serverData?.serverPriceMax}
            onPriceSelect={handlePriceSelect}
            onPriceInputChange={handlePriceInputChange}
            onResetToServer={actions.resetPriceToServer}
          />
          <hr />
          <LanguagesSection
            selectedLanguageCode={filters.selectedLanguageCode}
            onLanguageSelect={handleLanguageSelect}
          />
        </div>

        <div className="border-t px-7 py-4 flex justify-between items-center">
          <div
            className="text-lg font-medium cursor-pointer hover:text-brand-green duration-200"
            onClick={actions.clearAll}
          >
            Wyczyść wszystko
          </div>
          <Button type="submit" className="h-10 hover:bg-gray-800" onClick={applyFilters}>
            Pokaż wyniki
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

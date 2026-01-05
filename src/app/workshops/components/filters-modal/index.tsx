"use client";

import { XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import LanguagesSection from "@/app/retreats/components/filters-modal/sections/LaguageSection";
import PeriodSection from "@/app/retreats/components/filters-modal/sections/PeriodSection";
import PriceSection from "@/app/retreats/components/filters-modal/sections/PriceSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useFilterInitialData } from "./hooks/useFilterInitialData";
import { useFiltersState } from "./hooks/useFiltersState";
import CitiesSection from "./sections/CitiesSection";
import OnlineSection from "./sections/OnlineSection";
import TagsSection from "./sections/TagsSection";
import { buildFilterUrl } from "./utils/validation";

interface FiltersModalProps {
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FiltersModal = ({ isOpen, title, onOpenChange }: FiltersModalProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: initialData } = useFilterInitialData(isOpen);

  const initialFiltersFromUrl = useMemo(() => {
    if (!isOpen) return null;

    return {
      selectedCityName: searchParams.get("cities"),
      startDateFrom: searchParams.get("start_date_from"),
      startDateTo: searchParams.get("start_date_to"),
      priceMin: searchParams.get("price_min") ? Number(searchParams.get("price_min")) : null,
      priceMax: searchParams.get("price_max") ? Number(searchParams.get("price_max")) : null,
      selectedLanguageCode: searchParams.get("language"),
      selectedTags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
      format:
        searchParams.get("is_online") === "true"
          ? "online"
          : searchParams.get("is_onsite") === "true"
            ? "onsite"
            : "all",
    };
  }, [searchParams, isOpen]);

  const { filters, setters, actions, serverData } = useFiltersState(
    initialData,
    initialFiltersFromUrl as any,
  );

  const applyFilters = () => {
    const url = buildFilterUrl(filters, serverData.serverPriceMin, serverData.serverPriceMax);
    router.push(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-[90%] md:max-w-[710px] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="relative h-[82px] bg-white z-20 px-6 border-b rounded-t-lg flex items-center justify-center">
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogClose className="absolute right-5 top-1/2 -translate-y-1/2 p-0">
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4">
          <TagsSection
            selectedTags={filters.selectedTags}
            onToggle={(tag) => {
              const exists = filters.selectedTags.includes(tag);
              const next = exists
                ? filters.selectedTags.filter((t) => t !== tag)
                : [...filters.selectedTags, tag];
              setters.setSelectedTags(next);
            }}
          />
          <hr />

          <CitiesSection
            initialData={initialData}
            selectedCityName={filters.selectedCityName}
            onSelect={(city) =>
              setters.setSelectedCityName(city === filters.selectedCityName ? null : city)
            }
          />
          <hr />
          <OnlineSection value={filters.format} onChange={(v) => setters.setFormat(v)} />
          <hr />
          <LanguagesSection
            selectedLanguageCode={filters.selectedLanguageCode}
            onLanguageSelect={(code) =>
              setters.setSelectedLanguageCode(code === filters.selectedLanguageCode ? null : code)
            }
          />
          <hr />
          <PeriodSection
            startDateFrom={filters.startDateFrom}
            startDateTo={filters.startDateTo}
            onDateSelect={(from, to) => {
              setters.setStartDateFrom(from);
              setters.setStartDateTo(to);
            }}
            selectedPeriodSet={filters.selectedPeriodSet}
            onPeriodSelect={(p) => {
              if (!p) {
                setters.setSelectedPeriodSet(null);
                setters.setStartDateFrom(null);
                setters.setStartDateTo(null);
              } else {
                setters.setSelectedPeriodSet(p);
                setters.setStartDateFrom(p.start_date);
                setters.setStartDateTo(p.end_date);
              }
            }}
          />
          <hr />
          <PriceSection
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            serverPriceMin={serverData?.serverPriceMin}
            serverPriceMax={serverData?.serverPriceMax}
            onPriceSelect={(min, max) => {
              setters.setPriceMin(min);
              setters.setPriceMax(max);
            }}
            onPriceInputChange={(min, max) => {
              setters.setPriceMin(min);
              setters.setPriceMax(max);
            }}
            onResetToServer={actions.resetPriceToServer}
          />
          <hr />
        </div>

        <div className="border-t px-7 py-4 flex justify-between items-center">
          <div
            className="text-lg font-medium cursor-pointer hover:text-brand-green duration-200"
            onClick={() => {
              actions.clearAll();
            }}
          >
            Wyczyść wszystko
          </div>
          <Button type="button" className="h-10 hover:bg-gray-800" onClick={applyFilters}>
            Pokaż wyniki
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FiltersModal;

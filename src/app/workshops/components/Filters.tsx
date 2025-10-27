"use client";

import { ArrowDown, ArrowUp, Calendar, DollarSign, MapPin, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BookmarkButton } from "@/components/custom/BookmarkButton";
import BialystokIcon from "@/components/icons/cities/BialystokIcon";
import BydgoszczIcon from "@/components/icons/cities/BydgoszczIcon";
import GdanskIcon from "@/components/icons/cities/GdanskIcon";
import KatowiceIcon from "@/components/icons/cities/KatowiceIcon";
import KrakowIcon from "@/components/icons/cities/KrakowIcon";
import LodzIcon from "@/components/icons/cities/LodzIcon";
import LublinIcon from "@/components/icons/cities/LublinIcon";
import PoznanIcon from "@/components/icons/cities/PoznanIcon";
import SzczecinIcon from "@/components/icons/cities/SzczecinIcon";
import WarszawaIcon from "@/components/icons/cities/WarszawaIcon";
import CustomFilterOnlineIcon from "@/components/icons/CustomFilterOnlineIcon";
import CustomFilterTagsIcon from "@/components/icons/CustomFilterTagsIcon";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@/components/ui/tooltip";
import { useEventsFilter } from "@/context/EventsFilterContext";
import useIsMobile from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

import { FiltersModal } from "./filters-modal";
import { useFilterInitialData } from "./filters-modal/hooks/useFilterInitialData";

const CitiesIcons = {
  Krakow: KrakowIcon,
  Gdańsk: GdanskIcon,
  Łódź: LodzIcon,
  Białystok: BialystokIcon,
  Bydgoszcz: BydgoszczIcon,
  Lublin: LublinIcon,
  Warszawa: WarszawaIcon,
  Szczecin: SzczecinIcon,
  Katowice: KatowiceIcon,
  Poznań: PoznanIcon,
};

const Filters = () => {
  const {
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfigAndReset,
    isSearchActive,
    setIsSearchActiveAndReset,
    isBookmarksActive,
    toggleBookmarksView,
  } = useEventsFilter();

  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Load filter initial data to get available cities from server
  const { data: filterInitialData, loading: filterDataLoading } = useFilterInitialData(true);

  const hasActiveFiltersFromUrl = () => {
    const city = searchParams.get("city");
    const startDateFrom = searchParams.get("start_date_from");
    const startDateTo = searchParams.get("start_date_to");
    const priceMin = searchParams.get("price_min");
    const priceMax = searchParams.get("price_max");
    const language = searchParams.get("language");
    const tags = searchParams.get("tags");
    const isOnline = searchParams.get("is_online");
    const isOnsite = searchParams.get("is_onsite");

    return !!(
      city ||
      startDateFrom ||
      startDateTo ||
      priceMin ||
      priceMax ||
      language ||
      tags ||
      isOnline === "true" ||
      isOnline === "false" ||
      isOnsite === "true" ||
      isOnsite === "false"
    );
  };

  const isOnlineActive = searchParams.get("is_online") === "true";

  const handleToggleOnlineQuick = () => {
    const params = new URLSearchParams(searchParams.toString());
    const isOnlineParam = params.get("is_online");
    const isOnsiteParam = params.get("is_onsite");

    if (isOnlineParam === "true") {
      // If active, remove both is_online & is_onsite
      params.delete("is_online");
      params.delete("is_onsite");
    } else if (isOnsiteParam === "true") {
      // If onsite is set, switching to online should replace it
      params.set("is_online", "true");
      params.delete("is_onsite");
    } else {
      // No format filters: set online=true
      params.set("is_online", "true");
    }

    router.push(`/?${params.toString()}`);
  };

  const handleCityClick = (cityName: string) => {
    const currentCity = searchParams.get("city");
    const params = new URLSearchParams(searchParams.toString());
    if (currentCity === cityName) {
      params.delete("city");
    } else {
      params.set("city", cityName);
    }
    router.push(`/?${params.toString()}`);
  };

  const cities = filterDataLoading ? [] : filterInitialData?.cities || [];

  const selectedCityFromUrl = searchParams.get("city");

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchActiveAndReset(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsSearchActiveAndReset(false);
      }
    };

    if (isSearchActive) {
      document.addEventListener("keydown", handleKeyDown);
      if (!isMobile) {
        document.addEventListener("mousedown", handleClickOutside);
      }
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      if (!isMobile) {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (!isMobile) {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, [isSearchActive, setIsSearchActiveAndReset, isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };

    if (isCityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCityDropdownOpen]);

  return (
    <>
      {/* Mobile footer */}
      <div className="block md:hidden fixed bottom-0 z-50 w-full border-t bg-background">
        <div className="flex items-center justify-between gap-2 px-5 py-2">
          <button
            onClick={() => setIsFiltersModalOpen(true)}
            className={cn(
              "flex items-center justify-center rounded-full relative",
              "h-12 w-12",
              "hover:bg-gray-100 duration-200",
            )}
          >
            <Calendar className="w-6 h-6" />
          </button>
          <button
            onClick={() => setSortConfigAndReset({ field: "price", order: "asc" })}
            className={cn(
              "flex items-center justify-center rounded-full relative",
              "h-12 w-12",
              "hover:bg-gray-100 duration-200",
            )}
          >
            <DollarSign className="w-6 h-6" />
          </button>
          <div className="relative" ref={cityDropdownRef}>
            <button
              onClick={() => setIsFiltersModalOpen(true)}
              className={cn(
                "flex items-center justify-center rounded-full",
                "h-12 w-12",
                "hover:bg-gray-100 duration-200",
                hasActiveFiltersFromUrl() && "border-2 border-brand-green hover:border-brand-green",
              )}
            >
              <CustomFilterTagsIcon className="w-[40px] h-[40px] stroke-1" />
            </button>
          </div>
          <button
            onClick={() => setIsSearchActiveAndReset(!isSearchActive)}
            className={cn(
              "flex items-center justify-center rounded-full relative",
              "h-12 w-12",
              "hover:bg-gray-100 duration-200",
              isSearchActive && "border-2 border-brand-green hover:border-brand-green",
            )}
          >
            <Search className="w-6 h-6" />
          </button>

          <BookmarkButton
            isActive={isBookmarksActive}
            toggleHandler={toggleBookmarksView}
            size="mobile-footer"
            className={
              isBookmarksActive
                ? "border-2 border-brand-green hover:border-brand-green bg-transparent"
                : "bg-transparent"
            }
          />
        </div>
      </div>

      {/* Desktop sticky bar */}
      <div
        className={cn(
          "sticky top-[calc(64px+1px)] md:top-[calc(80px+1px)] z-50 w-full border-b bg-background",
        )}
      >
        <div
          className={cn(
            "flex container mx-auto justify-between gap-10 py-5 md:px-8",
            "hidden md:flex",
            isSearchActive && "md:hidden",
          )}
        >
          <div className="w-full relative">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                {cities
                  .filter((city) => Object.keys(CitiesIcons).includes(city.name))
                  .map((item, index) => (
                    <Tooltip key={index} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button
                          key={index}
                          aria-label={item.name}
                          className={cn(
                            "text-gray-800 group h-[calc(80px)] w-[calc(80px)] flex items-center justify-center rounded-0 border-transparent relative hover:bg-gray-100 duration-200 border-2",
                            selectedCityFromUrl === item.name
                              ? "border-brand-green hover:border-brand-green"
                              : "",
                          )}
                          onClick={() => handleCityClick(item.name)}
                        >
                          {(() => {
                            const Icon = (CitiesIcons as any)[item.name as any] || MapPin;
                            return (
                              <Icon className="h-[calc(80px-12px)] w-[calc(80px-4px)] stroke-[1.75px]" />
                            );
                          })()}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
              </TooltipProvider>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFiltersModalOpen(true)}
              className={cn(
                "flex items-center justify-center rounded-full relative",
                "h-[80px] w-[80px]",
                "hover:bg-gray-100 duration-200",
                hasActiveFiltersFromUrl() && "border-2 border-brand-green hover:border-brand-green",
              )}
            >
              <CustomFilterTagsIcon className="w-[56px] h-[56px] stroke-1" />
            </button>
            <button
              onClick={() => setSortConfigAndReset({ field: "start_date", order: "asc" })}
              className={cn(
                "flex items-center justify-center rounded-full relative",
                "h-[80px] w-[80px]",
                "hover:bg-gray-100 duration-200",
                sortConfig?.field === "start_date" &&
                  "border-2 border-brand-green hover:border-brand-green",
              )}
            >
              <Calendar className="w-[48px] h-[48px] stroke-1" />
              <div className="absolute bottom-[-6px] right-[-6px]">
                {sortConfig?.field === "start_date" && sortConfig.order === "asc" && (
                  <ArrowUp className="h-4 w-4 text-brand-green stroke-3" />
                )}
                {sortConfig?.field === "start_date" && sortConfig.order === "desc" && (
                  <ArrowDown className="h-4 w-4 text-brand-green stroke-3" />
                )}
              </div>
            </button>
            <button
              onClick={() => setSortConfigAndReset({ field: "price", order: "asc" })}
              className={cn(
                "flex items-center justify-center rounded-full relative",
                "h-[80px] w-[80px]",
                "hover:bg-gray-100 duration-200",
                sortConfig?.field === "price" &&
                  "border-2 border-brand-green hover:border-brand-green",
              )}
            >
              <DollarSign className="w-[48px] h-[48px] stroke-1" />
              <div className="absolute bottom-[-6px] right-[-6px]">
                {sortConfig?.field === "price" && sortConfig.order === "asc" && (
                  <ArrowUp className="h-4 w-4 text-brand-green stroke-3" />
                )}
                {sortConfig?.field === "price" && sortConfig.order === "desc" && (
                  <ArrowDown className="h-4 w-4 text-brand-green stroke-3" />
                )}
              </div>
            </button>
            <button
              onClick={handleToggleOnlineQuick}
              className={cn(
                "flex items-center justify-center rounded-full relative",
                "h-[80px] w-[80px]",
                "hover:bg-gray-100 duration-200",
                isOnlineActive && "border-2 border-brand-green hover:border-brand-green",
              )}
            >
              <CustomFilterOnlineIcon className="w-[56px] h-[56px] stroke-1" />
            </button>

            <button
              onClick={() => setIsSearchActiveAndReset(true)}
              className={cn(
                "flex items-center justify-center rounded-full",
                "h-[80px] w-[80px]",
                "hover:bg-gray-100 duration-200",
              )}
            >
              <Search className="w-[48px] h-[48px] stroke-1" />
            </button>
          </div>
        </div>

        <div
          className={cn(
            "container mx-auto items-center py-3 md:py-5 relative gap-1 md:h-[120px] px-5 md:px-8",
            isSearchActive ? "flex" : "hidden",
          )}
        >
          <div className="relative flex-grow w-full">
            <Input
              type="text"
              ref={searchInputRef}
              placeholder="Wyszukaj warsztaty..."
              className="pl-[48px] md:pl-[52px] w-full text-base md:text-xl rounded-[44px] h-[48px] md:h-[64px] pr-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <button
              aria-label="Close search"
              onClick={() => setIsSearchActiveAndReset(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <FiltersModal
        isOpen={isFiltersModalOpen}
        title="Filtr"
        onOpenChange={setIsFiltersModalOpen}
      />
    </>
  );
};

export default Filters;

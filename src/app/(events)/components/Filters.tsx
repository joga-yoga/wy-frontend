"use client";

import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronDown,
  DollarSign,
  MapPin,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { BookmarkButton } from "@/components/custom/BookmarkButton";
import BaliIcon from "@/components/icons/countries/BaliIcon";
import IndiaIcon from "@/components/icons/countries/IndiaIcon";
import ItalyIcon from "@/components/icons/countries/ItalyIcon";
import PolandIcon from "@/components/icons/countries/PolandIcon";
import PortugalIcon from "@/components/icons/countries/PortugalIcon";
import SpainIcon from "@/components/icons/countries/SpainIcon";
import SrilankaIcon from "@/components/icons/countries/SrilankaIcon";
import ThailandIcon from "@/components/icons/countries/ThailandIcon";
import CustomAnalyticsIcon from "@/components/icons/CustomAnalyticsIcon";
import { Input } from "@/components/ui/input";
import { TooltipContent } from "@/components/ui/tooltip";
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEventsFilter } from "@/context/EventsFilterContext";
import useIsMobile from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const Filters: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    locationFilter,
    setLocationFilterAndReset,
    sortConfig,
    setSortConfigAndReset,
    isSearchActive,
    setIsSearchActiveAndReset,
    isBookmarksActive,
    toggleBookmarksView,
  } = useEventsFilter();

  const isMobile = useIsMobile();
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const filterItems = [
    { Icon: PolandIcon, label: "Poland", filter: { country: "Poland" }, name: "PLN" },
    { Icon: IndiaIcon, label: "India", filter: { country: "India" }, name: "IND" },
    { Icon: ItalyIcon, label: "Italy", filter: { country: "Italy" }, name: "ITA" },
    { Icon: SpainIcon, label: "Spain", filter: { country: "Spain" }, name: "ESP" },
    { Icon: BaliIcon, label: "Bali", filter: { state_province: "Bali" }, name: "BAL" },
    { Icon: PortugalIcon, label: "Portugal", filter: { country: "Portugal" }, name: "POR" },
    { Icon: ThailandIcon, label: "Thailand", filter: { country: "Thailand" }, name: "THA" },
    { Icon: SrilankaIcon, label: "Shrilanka", filter: { country: "Sri Lanka" }, name: "SRI" },
  ];
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedFilterItem = locationFilter
    ? filterItems.find((item) => JSON.stringify(item.filter) === JSON.stringify(locationFilter))
    : null;
  const SelectedCountryIcon = selectedFilterItem?.Icon;

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
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    };

    if (isCountryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  return (
    <>
      {/* Mobile version of filters */}
      <div className="block md:hidden fixed bottom-0 z-50 w-full border-t bg-background">
        <div className="flex items-center justify-between gap-2 px-5 py-2">
          <button
            onClick={() => setSortConfigAndReset({ field: "start_date", order: "asc" })}
            className={cn(
              "flex items-center justify-center rounded-full relative",
              "h-12 w-12",
              "hover:bg-gray-100 duration-200",
              sortConfig?.field === "start_date" &&
                "border-2 border-brand-green hover:border-brand-green",
            )}
          >
            <Calendar className="w-6 h-6" />
            <div className="absolute bottom-[-6px] right-[-6px]">
              {sortConfig?.field === "start_date" && sortConfig.order === "asc" && (
                <ArrowUp className="h-3 w-3 text-brand-green stroke-3" />
              )}
              {sortConfig?.field === "start_date" && sortConfig.order === "desc" && (
                <ArrowDown className="h-3 w-3 text-brand-green stroke-3" />
              )}
            </div>
          </button>
          <button
            onClick={() => setSortConfigAndReset({ field: "price", order: "asc" })}
            className={cn(
              "flex items-center justify-center rounded-full relative",
              "h-12 w-12",
              "hover:bg-gray-100 duration-200",
              sortConfig?.field === "price" &&
                "border-2 border-brand-green hover:border-brand-green",
            )}
          >
            <DollarSign className="w-6 h-6" />
            <div className="absolute bottom-[-6px] right-[-6px]">
              {sortConfig?.field === "price" && sortConfig.order === "asc" && (
                <ArrowUp className="h-3 w-3 text-brand-green stroke-3" />
              )}
              {sortConfig?.field === "price" && sortConfig.order === "desc" && (
                <ArrowDown className="h-3 w-3 text-brand-green stroke-3" />
              )}
            </div>
          </button>
          <div className="relative" ref={countryDropdownRef}>
            <button
              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
              className={cn(
                "flex items-center justify-center rounded-full",
                "h-12 w-12",
                "hover:bg-gray-100 duration-200",
                // (SelectedCountryIcon || isCountryDropdownOpen) &&
                !isSearchActive &&
                  !isBookmarksActive &&
                  "border-2 border-brand-green hover:border-brand-green",
              )}
            >
              {isCountryDropdownOpen ? (
                <ChevronDown className="h-6 w-6" />
              ) : SelectedCountryIcon ? (
                <SelectedCountryIcon className="h-8 w-8" />
              ) : (
                <MapPin className="h-6 w-6" />
              )}
            </button>
            {isCountryDropdownOpen && (
              <div className="absolute bottom-[50px] left-[calc(-225px/2+44px/2)] mb-2 w-[calc(60dvw)] bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <ul className="py-1 max-h-[50dvh] overflow-y-auto">
                  <li>
                    <button
                      onClick={() => {
                        setLocationFilterAndReset(null);
                        setIsCountryDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-4",
                        !locationFilter && "text-brand-green",
                      )}
                    >
                      <MapPin className="h-8 w-8 text-gray-700 stroke-1" />
                      <span>Wszystkie kraje</span>
                    </button>
                  </li>
                  {filterItems.map((item) => (
                    <li key={item.label}>
                      <button
                        onClick={() => {
                          setLocationFilterAndReset(item.filter);
                          setIsCountryDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-4",
                          locationFilter &&
                            JSON.stringify(locationFilter) === JSON.stringify(item.filter) &&
                            "text-brand-green",
                        )}
                      >
                        <item.Icon className="h-8 w-8 stroke-[2px]" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

      {/* Desktop version of filters */}
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
                {filterItems.map((item, index) => (
                  <Tooltip key={index} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        key={index}
                        aria-label={item.label}
                        className={cn(
                          "text-gray-800 group h-[calc(80px)] w-[calc(80px)] flex items-center justify-center rounded-0 border-transparent relative hover:bg-gray-100 duration-200 border-2",
                          locationFilter &&
                            JSON.stringify(locationFilter) === JSON.stringify(item.filter) &&
                            "border-brand-green hover:border-brand-green",
                        )}
                        onClick={() => setLocationFilterAndReset(item.filter)}
                      >
                        <item.Icon className="h-[calc(80px-4px)] w-[calc(80px-4px)] stroke-[1px]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
              onClick={() => setIsSearchActiveAndReset(true)}
              className={cn(
                "flex items-center justify-center rounded-full",
                "h-[80px] w-[80px]",
                "hover:bg-gray-100 duration-200",
              )}
            >
              <Search className="w-[48px] h-[48px] stroke-1" />
            </button>
            {/* <BookmarkButton
              isActive={isBookmarksActive}
              toggleHandler={toggleBookmarksView}
              size="desktop-filter"
              className={
                isBookmarksActive
                  ? "border-2 border-brand-green hover:border-brand-green bg-transparent"
                  : "bg-transparent"
              }
            /> */}
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
              placeholder="Wyszukaj wyjazdy..."
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
    </>
  );
};

export default Filters;

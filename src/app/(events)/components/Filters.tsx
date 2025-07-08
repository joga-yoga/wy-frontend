"use client";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Earth,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

import BookmarkIconMobile from "@/components/icons/BookmarkIconMobile";
import BaliIcon from "@/components/icons/countries/BaliIcon";
import IndiaIcon from "@/components/icons/countries/IndiaIcon";
import ItalyIcon from "@/components/icons/countries/ItalyIcon";
import PolandIcon from "@/components/icons/countries/PolandIcon";
import PortugalIcon from "@/components/icons/countries/PortugalIcon";
import SpainIcon from "@/components/icons/countries/SpainIcon";
import SrilankaIcon from "@/components/icons/countries/SrilankaIcon";
import ThailandIcon from "@/components/icons/countries/ThailandIcon";
import CustomCalendarIcon from "@/components/icons/CustomCalendarIcon";
import CustomPriceIcon from "@/components/icons/CustomPriceIcon";
import CustomPriceIconMobile from "@/components/icons/CustomPriceIconMobile";
import CustomSearchIcon from "@/components/icons/CustomSearchIcon";
import CustomSearchIconMobile from "@/components/icons/CustomSearchIconMobile";
import { Input } from "@/components/ui/input";
import { useEventsFilter } from "@/context/EventsFilterContext";
import useIsMobile from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const Filters: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    countryFilter,
    setCountryFilterAndReset,
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
    { Icon: PolandIcon, label: "Poland", filterValue: "Poland", name: "PLN" },
    { Icon: IndiaIcon, label: "India", filterValue: "India", name: "IND" },
    { Icon: ItalyIcon, label: "Italy", filterValue: "Italy", name: "ITA" },
    { Icon: SpainIcon, label: "Spain", filterValue: "Spain", name: "ESP" },
    { Icon: BaliIcon, label: "Bali", filterValue: "Bali", name: "BAL" },
    { Icon: PortugalIcon, label: "Portugal", filterValue: "Portugal", name: "POR" },
    { Icon: ThailandIcon, label: "Thailand", filterValue: "Thailand", name: "THA" },
    { Icon: SrilankaIcon, label: "Shrilanka", filterValue: "Shrilanka", name: "SRI" },
  ];
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = countryFilter
    ? filterItems.find((item) => item.filterValue === countryFilter)
    : null;
  const SelectedCountryIcon = selectedCountry?.Icon;

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

  const countrySwiperRef = useRef<SwiperClass | null>(null);

  const [hideCountryPrev, setHideCountryPrev] = useState(
    // true
    false,
  );
  const [hideCountryNext, setHideCountryNext] = useState(false);

  const updateCountryNavVisibility = (swiper: SwiperClass) => {
    setHideCountryPrev(swiper.isBeginning);
    setHideCountryNext(
      swiper.isEnd || filterItems.length <= (swiper.params.slidesPerView as number)!,
    );
  };

  return (
    <>
      {/* Mobile version of filters */}
      <div className="block md:hidden fixed bottom-0 z-50 w-full border-t bg-background">
        <div className="flex items-center justify-between gap-2 px-5 py-3">
          <button
            aria-label="Calendar"
            className={cn(
              "group text-muted-foreground h-[48px] w-[48px] flex items-center justify-center border-2 md:border-4 border-transparent hover:border-[#CBD5E1] relative",
              sortConfig?.field === "start_date" && "border-brand-green hover:border-brand-green",
            )}
            onClick={() => setSortConfigAndReset({ field: "start_date", order: "asc" })}
          >
            <CustomCalendarIcon className="h-[44px] w-[44px]" />
            {sortConfig?.field === "start_date" && sortConfig.order === "asc" && (
              <ArrowUp className="absolute bottom-0.5 right-0.5 h-3 w-3 text-brand-green" />
            )}
            {sortConfig?.field === "start_date" && sortConfig.order === "desc" && (
              <ArrowDown className="absolute bottom-0.5 right-0.5 h-3 w-3 text-brand-green" />
            )}
          </button>

          <button
            aria-label="Price"
            className={cn(
              "group text-muted-foreground h-[48px] w-[48px] flex items-center justify-center border-2 md:border-4 border-transparent hover:border-[#CBD5E1] relative",
              sortConfig?.field === "price" && "border-brand-green hover:border-brand-green",
            )}
            onClick={() => setSortConfigAndReset({ field: "price", order: "asc" })}
          >
            <CustomPriceIconMobile className="h-[44px] w-[44px]" />
            {sortConfig?.field === "price" && sortConfig.order === "desc" && (
              <ArrowDown className="absolute bottom-0.5 right-0.5 h-3 w-3 text-brand-green" />
            )}
            {sortConfig?.field === "price" && sortConfig.order === "asc" && (
              <ArrowUp className="absolute bottom-0.5 right-0.5 h-3 w-3 text-brand-green" />
            )}
          </button>
          <div className="relative" ref={countryDropdownRef}>
            <button
              aria-label="Toggle country filter"
              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
              className="h-[44px] w-[44px] flex items-center justify-center rounded-full text-gray-700 bg-gray-100"
            >
              {isCountryDropdownOpen ? (
                <ChevronDown className="h-[28px] w-[28px]" />
              ) : SelectedCountryIcon ? (
                <SelectedCountryIcon className="h-[28px] w-[28px]" />
              ) : (
                <Earth className="h-8 w-8 stroke-[0.5px]" />
              )}
            </button>
            {isCountryDropdownOpen && (
              <div className="absolute bottom-[50px] left-[calc(-225px/2+44px/2)] mb-2 w-[calc(60dvw)] bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <ul className="py-1 max-h-[50dvh] overflow-y-auto">
                  <li>
                    <button
                      onClick={() => {
                        setCountryFilterAndReset("");
                        setIsCountryDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-4",
                        !countryFilter && "text-brand-green",
                      )}
                    >
                      <Earth className="h-8 w-8 stroke-[0.5px] text-black" />
                      <span>Wszystkie kraje</span>
                    </button>
                  </li>
                  {filterItems.map((item) => (
                    <li key={item.filterValue}>
                      <button
                        onClick={() => {
                          setCountryFilterAndReset(item.filterValue);
                          setIsCountryDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-4",
                          countryFilter === item.filterValue && "text-brand-green",
                        )}
                      >
                        <item.Icon className="h-8 w-8" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            aria-label="Search"
            onClick={() => setIsSearchActiveAndReset(!isSearchActive)}
            className={cn(
              "group text-muted-foreground h-[48px] w-[48px] flex items-center justify-center border-2 border-transparent hover:border-[#CBD5E1] relative",
              isSearchActive && "border-brand-green hover:border-brand-green",
            )}
          >
            <CustomSearchIconMobile className="h-[44px] w-[44px]" />
          </button>
          <button
            aria-label="Toggle Bookmarks"
            onClick={toggleBookmarksView}
            className={cn("", isBookmarksActive && "text-brand-green")}
          >
            {isBookmarksActive ? (
              <div className="flex items-center justify-center relative">
                <BookmarkIconMobile className="h-[44px] w-[44px] z-10" />
                <div className="absolute top-1 right-1 bg-brand-green rounded-full p-4" />
              </div>
            ) : (
              <BookmarkIconMobile className="h-[44px] w-[44px]" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop version of filters */}
      <div
        className={cn(
          "container mx-auto hidden md:flex justify-between gap-10 py-5",
          isSearchActive && "md:hidden",
        )}
      >
        <div className="w-full relative">
          <button
            aria-label="Previous country"
            onClick={() => {
              countrySwiperRef.current?.slidePrev();
            }}
            className={`text-gray-600 absolute left-[-68px] top-[20px] ${hideCountryPrev ? "hidden" : ""}`}
            disabled={hideCountryPrev}
          >
            <ChevronLeft className="h-[48px] w-[48px]" />
          </button>
          <Swiper
            modules={[Navigation]}
            spaceBetween="0px"
            // slidesPerView={6}
            breakpoints={{
              // when window width is >= 320px
              320: {
                slidesPerView: 2,
              },
              // when window width is >= 480px
              480: {
                slidesPerView: 3,
              },
              // when window width is >= 640px
              640: {
                slidesPerView: 10,
              },
            }}
            // initialSlide={initialSlideCountries}
            onSwiper={(swiper) => {
              countrySwiperRef.current = swiper;
              updateCountryNavVisibility(swiper);
            }}
            onSlideChange={updateCountryNavVisibility}
            // className="w-[calc(100%-280px)]"
          >
            {filterItems.map((item, index) => (
              <SwiperSlide
                key={index}
                className="h-[88px] w-[108px] min-w-[108px]"
                style={{ width: 88 }}
              >
                <button
                  aria-label={item.label}
                  className={cn(
                    "group text-muted-foreground h-[88px] w-[88px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative",
                    countryFilter === item.filterValue &&
                      "border-brand-green hover:border-brand-green",
                  )}
                  onClick={() => setCountryFilterAndReset(item.filterValue)}
                >
                  <item.Icon className="h-[88px] w-[88px]" />
                  <span className="absolute top-0 left-0 text-2xl/6 font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    {item.name}
                  </span>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
          <button
            aria-label="Next country"
            onClick={() => {
              countrySwiperRef.current?.slideNext();
            }}
            className={`text-gray-600 absolute right-[-48px] top-[20px] ${hideCountryNext ? "hidden" : ""}`}
            disabled={hideCountryNext}
          >
            <ChevronRight className="h-[48px] w-[48px]" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 min-w-[280px]">
          <button
            aria-label="Calendar"
            className={cn(
              "group text-muted-foreground h-[88px] w-[88px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative",
              sortConfig?.field === "start_date" && "border-brand-green hover:border-brand-green",
            )}
            onClick={() => setSortConfigAndReset({ field: "start_date", order: "asc" })}
          >
            <CustomCalendarIcon className="h-[64px] w-[64px]" />
            {sortConfig?.field === "start_date" && sortConfig.order === "asc" && (
              <ArrowUp className="absolute bottom-1 right-1 h-4 w-4 text-brand-green" />
            )}
            {sortConfig?.field === "start_date" && sortConfig.order === "desc" && (
              <ArrowDown className="absolute bottom-1 right-1 h-4 w-4 text-brand-green" />
            )}
          </button>

          <button
            aria-label="Price"
            className={cn(
              "group text-muted-foreground h-[88px] w-[88px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative",
              sortConfig?.field === "price" && "border-brand-green hover:border-brand-green",
            )}
            onClick={() => setSortConfigAndReset({ field: "price", order: "desc" })}
          >
            <CustomPriceIcon className="h-[88px] w-[88px]" />
            {sortConfig?.field === "price" && sortConfig.order === "desc" && (
              <ArrowDown className="absolute bottom-1 right-1 h-4 w-4 text-brand-green" />
            )}
            {sortConfig?.field === "price" && sortConfig.order === "asc" && (
              <ArrowUp className="absolute bottom-1 right-1 h-4 w-4 text-brand-green" />
            )}
          </button>
          {/* Bookmark button is managed by context, can be moved to header later */}
          {/* This button in Filters will now use toggleBookmarksView */}
          <button
            aria-label="Search"
            className="group text-muted-foreground h-[88px] w-[88px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative"
            onClick={() => setIsSearchActiveAndReset(true)}
          >
            <CustomSearchIcon className="h-[88px] w-[88px]" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "container mx-auto items-center pt-5 md:py-5 relative gap-1 md:h-[128px] px-5 md:px-0",
          isSearchActive ? "flex" : "hidden",
        )}
      >
        <div className="relative flex-grow w-full">
          <Input
            type="text"
            ref={searchInputRef}
            placeholder="Search events..."
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
    </>
  );
};

export default Filters;

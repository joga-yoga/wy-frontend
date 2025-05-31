"use client"; // Add this line for client-side rendering

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import axios from "axios"; // Import axios itself for isAxiosError
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe,
  Search,
} from "lucide-react";
import Image from "next/image"; // Import next/image
import Link from "next/link"; // Import Link from next/link
import React, { useEffect, useRef, useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

import ActiveBookmarkIcon from "@/components/icons/ActiveBookmarkIcon";
import BookmarkIcon from "@/components/icons/BookmarkIcon"; // Import custom BookmarkIcon
import BaliIcon from "@/components/icons/countries/BaliIcon";
import IndiaIcon from "@/components/icons/countries/IndiaIcon";
import ItalyIcon from "@/components/icons/countries/ItalyIcon";
import PolandIcon from "@/components/icons/countries/PolandIcon";
import PortugalIcon from "@/components/icons/countries/PortugalIcon";
import SpainIcon from "@/components/icons/countries/SpainIcon";
import SrilankaIcon from "@/components/icons/countries/SrilankaIcon";
import ThailandIcon from "@/components/icons/countries/ThailandIcon";
import CustomBookmarkIcon from "@/components/icons/CustomBookmarkIcon";
import CustomCalendarIcon from "@/components/icons/CustomCalendarIcon";
import CustomPriceIcon from "@/components/icons/CustomPriceIcon";
import CustomSearchIcon from "@/components/icons/CustomSearchIcon";
import PolandFlagIcon from "@/components/icons/flags/PolandFlagIcon"; // Import PolandFlagIcon
import { Button } from "@/components/ui/button"; // Import shadcn Button
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance"; // Import axios instance
import {
  addBookmark,
  getBookmarkedEvents,
  isEventBookmarked,
  removeBookmark,
} from "@/lib/bookmarks";
import { cn } from "@/lib/utils";

// Define the structure of a Location object based on the API response
interface Location {
  id: string;
  title: string | null;
  // address_line1: string | null; // Not immediately needed for card
  // city: string | null; // title might serve as city or venue
  // state_province: string | null;
  // postal_code: string | null;
  country: string | null;
  // latitude?: number | null;
  // longitude?: number | null;
  // google_maps_url?: string | null;
  // image_id?: string | null;
}

// Define the structure of an event based on the API response
interface Event {
  id: string;
  title: string;
  description: string | null; // Updated to be optional
  start_date: string;
  end_date: string | null; // Updated to be optional
  location: Location | null; // Updated to use Location interface
  // country: string; // Removed, now part of Location object
  price: number | null; // Updated to be optional
  image_ids?: string[]; // Changed from image_id to image_ids
  is_public: boolean;
  currency: string | null;
  main_attractions?: string | null;
  language?: string | null;
  skill_level?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  min_child_age?: number | null;
  itinerary?: string | null;
  included_trips?: string | null;
  food_description?: string | null;
  price_includes?: string | null;
  price_excludes?: string | null;
  accommodation_description?: string | null;
  guest_welcome_description?: string | null;
  paid_attractions?: string | null;
  cancellation_policy?: string | null;
  important_info?: string | null;
  program?: string[] | null;
  // organizer_id: string; // Available, but not used in card
  // instructor_ids: string[]; // Available, but not used in card
}

// --- Define SortConfig interface ---
interface SortConfig {
  field: "price" | "start_date" | null;
  order: "asc" | "desc" | null;
}

// --- Updated Filters Component --- (Receives searchTerm and setSearchTerm)
interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  countryFilter: string;
  setCountryFilter: (country: string) => void;
  sortConfig: SortConfig | null; // Changed from sortBy
  setSortConfig: (sortConfig: SortConfig | null) => void; // Changed from setSortBy
  isSearchActive: boolean;
  setIsSearchActive: (isSearchActive: boolean) => void;
  isBookmarksActive: boolean;
  setIsBookmarksActive: (isBookmarksActive: boolean) => void;
}

const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  countryFilter,
  setCountryFilter,
  sortConfig, // Changed from sortBy
  setSortConfig, // Changed from setSortBy
  isSearchActive,
  setIsSearchActive,
  isBookmarksActive,
  setIsBookmarksActive,
}) => {
  // Moved filter items here
  const filterItems = [
    { Icon: BaliIcon, label: "Bali", filterValue: "Bali", name: "BAL" },
    { Icon: SrilankaIcon, label: "Shrilanka", filterValue: "Shrilanka", name: "SRI" },
    { Icon: PortugalIcon, label: "Portugal", filterValue: "Portugal", name: "POR" },
    { Icon: PolandIcon, label: "Poland", filterValue: "Poland", name: "PLN" },
    { Icon: ItalyIcon, label: "Italy", filterValue: "Italy", name: "ITA" },
    { Icon: IndiaIcon, label: "India", filterValue: "India", name: "IND" },
    { Icon: SpainIcon, label: "Spain", filterValue: "Spain", name: "ESP" },
    { Icon: ThailandIcon, label: "Thailand", filterValue: "Thailand", name: "THA" },
  ];
  const searchInputRef = useRef<HTMLInputElement>(null);
  console.log("🚀 ~ searchInputRef:", searchInputRef);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]); // Re-run when isSearchActive changes

  const countrySwiperRef = useRef<SwiperClass | null>(null);
  const slidesPerViewCountries = 5;
  const initialSlideCountries = Math.max(0, filterItems.length - slidesPerViewCountries);

  const [hideCountryPrev, setHideCountryPrev] = useState(true); // Initial state, will be updated by onSwiper
  const [hideCountryNext, setHideCountryNext] = useState(
    filterItems.length <= slidesPerViewCountries,
  ); // Initial state

  const updateCountryNavVisibility = (swiper: SwiperClass) => {
    setHideCountryPrev(swiper.isBeginning);
    setHideCountryNext(
      swiper.isEnd || filterItems.length <= (swiper.params.slidesPerView as number)!,
    );
  };

  return (
    <>
      <div
        className={cn(
          "container mx-auto flex justify-between gap-10 py-5",
          isSearchActive && "hidden",
        )}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            aria-label="Previous country"
            onClick={() => countrySwiperRef.current?.slidePrev()}
            className={`text-gray-600 p-2 ${hideCountryPrev ? "opacity-0" : "opacity-100"}`}
            disabled={hideCountryPrev}
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <Swiper
            modules={[Navigation]}
            spaceBetween={10}
            slidesPerView={slidesPerViewCountries}
            initialSlide={initialSlideCountries}
            onSwiper={(swiper) => {
              countrySwiperRef.current = swiper;
              updateCountryNavVisibility(swiper);
            }}
            onSlideChange={updateCountryNavVisibility}
            className="w-[440px]"
          >
            {filterItems.map((item, index) => (
              <SwiperSlide key={index}>
                <button
                  aria-label={item.label}
                  className={cn(
                    "group text-muted-foreground h-[80px] w-[80px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative",
                    countryFilter === item.filterValue &&
                      "border-brand-green hover:border-brand-green",
                  )}
                  onClick={() => setCountryFilter(item.filterValue)}
                >
                  <item.Icon className="h-[48px] w-[48px]" />
                  <span className="absolute top-0 left-0 text-2xl/6 font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                    {item.name}
                  </span>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
          <button
            aria-label="Next country"
            onClick={() => countrySwiperRef.current?.slideNext()}
            className={`text-gray-600 p-2 ${hideCountryNext ? "opacity-0" : "opacity-100"}`}
            disabled={hideCountryNext}
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label="Calendar"
            className={cn(
              "group text-muted-foreground h-[80px] w-[80px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative",
              // Adjust border logic based on sortConfig - will refine this later
              sortConfig?.field === "start_date" && "border-brand-green hover:border-brand-green",
            )}
            onClick={() => {
              if (sortConfig?.field === "start_date" && sortConfig.order === "asc") {
                setSortConfig({ field: "start_date", order: "desc" });
              } else if (sortConfig?.field === "start_date" && sortConfig.order === "desc") {
                setSortConfig(null);
              } else {
                setSortConfig({ field: "start_date", order: "asc" });
              }
            }}
          >
            <CustomCalendarIcon className="h-[60px] w-[60px]" />
            {/* Placeholder for sort icon - will add later */}
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
              "group text-muted-foreground h-[80px] w-[80px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative",
              // Adjust border logic based on sortConfig - will refine this later
              sortConfig?.field === "price" && "border-brand-green hover:border-brand-green",
            )}
            onClick={() => {
              if (sortConfig?.field === "price" && sortConfig.order === "desc") {
                setSortConfig({ field: "price", order: "asc" });
              } else if (sortConfig?.field === "price" && sortConfig.order === "asc") {
                setSortConfig(null);
              } else {
                setSortConfig({ field: "price", order: "desc" });
              }
            }}
          >
            <CustomPriceIcon className="h-[60px] w-[60px]" />
            {/* Placeholder for sort icon - will add later */}
            {sortConfig?.field === "price" && sortConfig.order === "desc" && (
              <ArrowDown className="absolute bottom-1 right-1 h-4 w-4 text-brand-green" />
            )}
            {sortConfig?.field === "price" && sortConfig.order === "asc" && (
              <ArrowUp className="absolute bottom-1 right-1 h-4 w-4 text-brand-green" />
            )}
          </button>
          <button
            aria-label="Bookmarks"
            className={cn(
              "group text-muted-foreground h-[80px] w-[80px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative",
              isBookmarksActive && "border-brand-green hover:border-brand-green",
            )}
            onClick={() => {
              setIsBookmarksActive(!isBookmarksActive); // <-- MODIFIED: Toggle bookmark state
            }}
          >
            <CustomBookmarkIcon className="h-[60px] w-[60px]" />
          </button>
          <button
            aria-label="Search"
            className="group text-muted-foreground h-[80px] w-[80px] flex items-center justify-center border-4 border-transparent hover:border-[#CBD5E1] relative"
            onClick={() => {
              setIsSearchActive(true);
            }}
          >
            <CustomSearchIcon className="h-[60px] w-[60px]" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "container mx-auto items-center py-5 relative gap-1 h-[120px] hidden",
          isSearchActive && "flex",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="Search"
          onClick={() => {
            setIsSearchActive(false);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="relative flex-grow w-full">
          <Input
            type="search"
            ref={searchInputRef}
            placeholder="Search events..." // Updated placeholder
            className="pl-[52px] w-full md:text-xl rounded-[44px] h-[64px]"
            value={searchTerm} // Controlled input
            onChange={(e) => setSearchTerm(e.target.value)} // Update state on change
          />
          <Search className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </>
  );
};

// Moved and updated formatDateRange function
const formatDateRange = (start: string, end: string | null): string => {
  try {
    if (!start || typeof start !== "string") {
      return "Brak daty";
    }
    const startDateObj = new Date(start);
    if (isNaN(startDateObj.getTime())) {
      return "Nieprawidłowa data";
    }

    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const startDateFormatted = startDateObj.toLocaleDateString("pl-PL", options).replace(".", "");

    if (!end || typeof end !== "string") {
      return startDateFormatted;
    }
    const endDateObj = new Date(end);
    if (isNaN(endDateObj.getTime())) {
      return startDateFormatted;
    }
    const endDateFormatted = endDateObj.toLocaleDateString("pl-PL", options).replace(".", "");

    return `${startDateFormatted} - ${endDateFormatted}`;
  } catch (e) {
    console.error("Error formatting date range:", start, end, e);
    return "Błąd daty";
  }
};

// Helper function to calculate price per day
const calculatePricePerDay = (
  price: number | null,
  startDateStr: string,
  endDateStr: string | null,
): string | null => {
  if (price === null || !startDateStr) {
    return null;
  }

  try {
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) return null;

    let durationDays = 1;
    if (endDateStr) {
      const endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) return null;

      // Calculate the difference in time; convert to days
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      // Add 1 because if start and end are same day, it's 1 day event
      durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (endDate.getTime() < startDate.getTime()) return null; // End date cannot be before start date for valid duration
      if (durationDays <= 0) durationDays = 1; // Ensure at least 1 day if dates are same or end is slightly off
    } else {
      // If no end date, assume 1 day event
      durationDays = 1;
    }

    const pricePerDay = price / durationDays;
    return `${Math.round(pricePerDay)} zł./dobę`;
  } catch (e) {
    console.error("Error calculating price per day:", e);
    return null;
  }
};

// Refactored EventCard component using shadcn/ui Card
interface EventCardProps {
  event: Event;
  isBookmarkedInitial: boolean; // <-- ADDED
  onBookmarkToggle: (eventId: string, isBookmarked: boolean) => void; // <-- ADDED
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  isBookmarkedInitial, // <-- ADDED
  onBookmarkToggle, // <-- ADDED
}) => {
  const baseImageUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo"}/image/upload/`;
  const placeholderImageUrl = `https://via.placeholder.com/616x380?text=No+Image`; // Adjusted placeholder size

  const displayCountry = event.location?.country || "Lokalizacja N/A";
  const displayLocationTitle = event.location?.title || ""; // Text below image

  const [hidePrev, setHidePrev] = useState(true);
  const [hideNext, setHideNext] = useState(!(event.image_ids && event.image_ids.length > 1));

  const [isBookmarked, setIsBookmarked] = useState(isBookmarkedInitial); // <-- ADDED State for bookmark

  // Effect to update local bookmark state if initial prop changes (e.g. due to parent re-render)
  useEffect(() => {
    setIsBookmarked(isBookmarkedInitial);
  }, [isBookmarkedInitial]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);
    onBookmarkToggle(event.id, newBookmarkState);
  };

  const updateNavVisibility = (swiper: SwiperClass) => {
    setHidePrev(swiper.isBeginning);
    setHideNext(swiper.isEnd);
  };

  // Unique class names for swiper navigation
  const prevButtonClass = `event-swiper-prev-${event.id}`;
  const nextButtonClass = `event-swiper-next-${event.id}`;

  return (
    <div className="box-border flex flex-col items-start p-[22px] gap-[22px] w-full bg-white border-[4px] border-gray-50 shadow-[0px_8px_16px_8px_#FAFAFA] rounded-[22px]">
      {/* Head Plashka */}
      <div className="flex flex-row items-center p-0 gap-[32px] w-full h-[55px] self-stretch">
        {/* Calendar Plashka */}
        <div className="flex flex-row justify-center items-center p-0 gap-[12px] min-w-[250px] sm:min-w-[300px] h-[55px] bg-[#F2F2F3] rounded-[6px]">
          <CalendarDays className="w-[32px] h-[32px] text-[#3F3F46]" />{" "}
          {/* Adjusted icon size and color */}
          <span className="font-semibold text-[24px] sm:text-[30px] leading-[30px] text-[#3F3F46] whitespace-nowrap">
            {formatDateRange(event.start_date, event.end_date)}
          </span>
        </div>

        {/* Country Header */}
        <div className="flex flex-row items-center p-0 gap-[8px] h-[49px]">
          {/* Placeholder for flag_icon, using Lucide Globe or specific flag */}
          {event.location?.country?.toLowerCase() === "polska" ||
          event.location?.country?.toLowerCase() === "poland" ? (
            <PolandFlagIcon className="w-[32px] h-[32px] sm:w-[44px] sm:h-[44px] rounded-full object-cover border border-gray-300" />
          ) : (
            <Globe className="w-[32px] h-[32px] sm:w-[44px] sm:h-[44px] text-[#71717A]" />
          )}
          <span className="font-semibold text-[24px] sm:text-[30px] leading-[30px] text-[#71717A] whitespace-nowrap">
            {displayCountry}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-grow"></div>

        {/* Star Icon */}
        <div className="w-[44px] h-[44px] flex items-center justify-center">
          <button onClick={handleBookmarkClick} aria-label="Toggle bookmark" className="p-2">
            {isBookmarked ? (
              <ActiveBookmarkIcon className="w-7 h-7 sm:w-9 sm:h-9 text-brand-green" />
            ) : (
              <BookmarkIcon className="w-7 h-7 sm:w-9 sm:h-9 cursor-pointer" />
            )}
          </button>
          {/* Adjusted size via className */}
        </div>
      </div>
      {/* Main Content Frame (Image + Text Details) */}
      <div className="flex flex-col md:flex-row items-start md:items-center p-0 gap-[45px] w-full self-stretch">
        {/* Image and Location Title Area */}
        <div className="flex flex-col gap-[12px] w-full md:w-[616px] flex-shrink-0">
          <div className="relative w-full h-[300px] sm:h-[380px] rounded-[11px] overflow-hidden">
            {event.image_ids && event.image_ids.length > 0 ? (
              <Swiper
                modules={[Navigation]}
                spaceBetween={0}
                slidesPerView={1}
                navigation={{
                  prevEl: `.${prevButtonClass}`,
                  nextEl: `.${nextButtonClass}`,
                }}
                pagination={false}
                className="h-full w-full"
                loop={false}
                onSwiper={updateNavVisibility}
                onSlideChange={updateNavVisibility}
              >
                {event.image_ids.map((imageId) => (
                  <SwiperSlide key={imageId} className="h-full w-full">
                    <div className="relative h-full w-full">
                      <Image
                        src={`${baseImageUrl}${imageId}`}
                        alt={event.title || "Event image"}
                        fill
                        sizes="(max-width: 768px) 100vw, 616px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="relative h-full w-full">
                <Image
                  src={placeholderImageUrl}
                  alt="No image available"
                  fill
                  sizes="(max-width: 768px) 100vw, 616px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            {/* Custom Swiper Arrows */}
            {event.image_ids && event.image_ids.length > 1 && (
              <>
                <button
                  className={`${prevButtonClass} absolute top-1/2 left-3 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-opacity duration-300 ${hidePrev ? "opacity-0" : "opacity-100"}`}
                >
                  <ArrowLeft className="h-6 w-6 text-gray-700" />
                </button>
                <button
                  className={`${nextButtonClass} absolute top-1/2 right-3 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-opacity duration-300 ${hideNext ? "opacity-0" : "opacity-100"}`}
                >
                  <ArrowRight className="h-6 w-6 text-gray-700" />
                </button>
              </>
            )}
          </div>
          {displayLocationTitle && (
            <p className="font-medium text-[20px] sm:text-[24px] leading-[30px] text-[#52525B]">
              {displayLocationTitle}
            </p>
          )}
        </div>

        {/* Text Details Area (Title, Description, Price) */}
        <div className="flex flex-col justify-center items-start gap-[12px] flex-grow self-stretch md:h-[380px] pt-[8px] md:pt-0">
          {/* Header & Description Block */}
          <div className="flex flex-col items-start gap-[20px] sm:gap-[30px] w-full">
            <h2 className="font-semibold text-4xl/11 text-gray-700 self-stretch line-clamp-2">
              {event.title || "Tytuł Wydarzenia"}
            </h2>
            <p className="font-medium text-[18px] sm:text-[20px] leading-[26px] sm:leading-[30px] tracking-[-0.01em] text-[#71717A] self-stretch line-clamp-3 sm:line-clamp-4 md:line-clamp-7">
              {event.description || "Brak opisu."}
            </p>
          </div>

          {/* Spacer taking remaining space */}
          <div className="flex-grow"></div>

          {/* Price Plashka */}
          <div className="flex flex-col justify-center items-end w-full self-stretch gap-0">
            <div className="flex flex-row justify-end items-center w-full h-[30px]">
              <span className="font-medium text-2xl text-right text-gray-700 flex-grow">
                {event.price !== null ? `od ${event.price} ${event.currency || "PLN"}` : "Cena N/A"}
              </span>
            </div>
            {/* Secondary price line - Price per day */}
            {event.price !== null && event.start_date && (
              <div className="flex flex-row justify-end items-center w-full h-[22px]">
                <span className="font-medium text-lg text-gray-400 text-right flex-grow">
                  {calculatePricePerDay(event.price, event.start_date, event.end_date)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Under Line Separator */}
      <div className="w-full h-[1px] bg-[#A1A1AA] mt-[10px]"></div> {/* Simplified line */}
    </div>
  );
};

const EVENTS_PER_PAGE = 1; // Define a constant for items per page

// Refactored EventsPage component
const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [skip, setSkip] = useState<number>(0); // State for pagination skip
  const [totalEvents, setTotalEvents] = useState<number>(0); // State for total events count
  const [isBookmarksActive, setIsBookmarksActive] = useState<boolean>(false);
  const [bookmarkedEventIds, setBookmarkedEventIds] = useState<string[]>([]); // <-- ADDED

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      clearTimeout(timerId); // Cleanup timeout on unmount or searchTerm change
    };
  }, [searchTerm]);

  // Fetch bookmarked event IDs from localStorage on mount and when isBookmarksActive changes
  useEffect(() => {
    setBookmarkedEventIds(getBookmarkedEvents());
  }, [isBookmarksActive]);

  // Fetch events - handles initial load and filter/sort changes
  useEffect(() => {
    const fetchInitialOrFilteredEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        // If bookmarks active, we don't apply other filters at API level initially
        // We will filter client-side after fetching a broader set of events
        if (!isBookmarksActive) {
          if (debouncedSearchTerm) {
            params.append("search", debouncedSearchTerm);
          }
          if (countryFilter) {
            params.append("country", countryFilter);
          }
          if (sortConfig && sortConfig.field && sortConfig.order) {
            params.append("sortBy", sortConfig.field);
            params.append("sortOrder", sortConfig.order);
          }
        }
        params.append("limit", EVENTS_PER_PAGE.toString());
        params.append("skip", "0"); // Always fetch from the beginning for this effect

        const apiUrl = `/events/public?${params.toString()}`;
        console.log(`Fetching initial/filtered events from: ${apiUrl}`);
        const response = await axiosInstance.get(apiUrl);
        const responseData = response.data;

        if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
          const processedEvents: Event[] = responseData.items.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            location: item.location,
            price: item.price,
            image_ids: item.image_ids,
            is_public: item.is_public,
            currency: item.currency,
            main_attractions: item.main_attractions,
            language: item.language,
            skill_level: item.skill_level,
            min_age: item.min_age,
            max_age: item.max_age,
            min_child_age: item.min_child_age,
            itinerary: item.itinerary,
            included_trips: item.included_trips,
            food_description: item.food_description,
            price_includes: item.price_includes,
            price_excludes: item.price_excludes,
            accommodation_description: item.accommodation_description,
            guest_welcome_description: item.guest_welcome_description,
            paid_attractions: item.paid_attractions,
            cancellation_policy: item.cancellation_policy,
            important_info: item.important_info,
            program: item.program,
          }));
          setEvents(processedEvents);
          setTotalEvents(responseData.total || 0);
          setSkip(processedEvents.length); // Set skip to the number of items just loaded

          if (isBookmarksActive) {
            const locallyBookmarkedIds = getBookmarkedEvents();
            const filtered = processedEvents.filter((event) =>
              locallyBookmarkedIds.includes(event.id),
            );
            setEvents(filtered);
            // For bookmarks, totalEvents count is effectively the number of bookmarked items from the current fetched page.
            // This might need adjustment if we want to show "X bookmarked events out of Y total on server".
            // For now, total will reflect what can be shown.
            // To show ALL bookmarked events even if they are not in the first fetched page,
            // we would need to fetch ALL events, or have a specific API endpoint for bookmarked events.
            // Current implementation: paginate through all events and filter.
            setTotalEvents(responseData.total || 0); // Still use API total for "load more" condition with bookmarks
            setSkip(EVENTS_PER_PAGE); // We fetched one page
          } else {
            setEvents(processedEvents);
            setTotalEvents(responseData.total || 0);
            setSkip(processedEvents.length); // Set skip to the number of items just loaded
          }
        } else {
          console.warn("API response did not contain expected 'items' array:", responseData);
          setEvents([]);
          setTotalEvents(0);
          setSkip(0);
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Failed to fetch events: ${errorMessage}. Please try again.`);
        setEvents([]);
        setTotalEvents(0);
        setSkip(0);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialOrFilteredEvents();
  }, [debouncedSearchTerm, countryFilter, sortConfig, isBookmarksActive]); // Added isBookmarksActive dependency

  const handleLoadMore = async () => {
    if (loading || (events.length >= totalEvents && !isBookmarksActive)) return;
    // For bookmarks, we might need to load more even if current events.length seems high,
    // because many fetched items might be filtered out.
    // The condition `events.length >= totalEvents` should ideally apply to the *potential* total if not filtering.
    // Or, more simply, allow load more if `skip < totalEvents`.

    if (loading || skip >= totalEvents) return;

    setLoading(true); // Indicate loading for "load more"
    setError(null);
    try {
      const params = new URLSearchParams();
      // Include existing filters/search/sort when loading more, UNLESS bookmarks are active
      if (!isBookmarksActive) {
        if (debouncedSearchTerm) {
          params.append("search", debouncedSearchTerm);
        }
        if (countryFilter) {
          params.append("country", countryFilter);
        }
        if (sortConfig && sortConfig.field && sortConfig.order) {
          params.append("sortBy", sortConfig.field);
          params.append("sortOrder", sortConfig.order);
        }
      }
      params.append("limit", EVENTS_PER_PAGE.toString());
      params.append("skip", skip.toString()); // Use current skip value

      const apiUrl = `/events/public?${params.toString()}`;
      console.log(`Loading more events from: ${apiUrl}`);
      const response = await axiosInstance.get(apiUrl);
      const responseData = response.data;

      if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
        const newEvents: Event[] = responseData.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          start_date: item.start_date,
          end_date: item.end_date,
          location: item.location,
          price: item.price,
          image_ids: item.image_ids,
          is_public: item.is_public,
          currency: item.currency,
          main_attractions: item.main_attractions,
          language: item.language,
          skill_level: item.skill_level,
          min_age: item.min_age,
          max_age: item.max_age,
          min_child_age: item.min_child_age,
          itinerary: item.itinerary,
          included_trips: item.included_trips,
          food_description: item.food_description,
          price_includes: item.price_includes,
          price_excludes: item.price_excludes,
          accommodation_description: item.accommodation_description,
          guest_welcome_description: item.guest_welcome_description,
          paid_attractions: item.paid_attractions,
          cancellation_policy: item.cancellation_policy,
          important_info: item.important_info,
          program: item.program,
        }));

        if (isBookmarksActive) {
          const locallyBookmarkedIds = getBookmarkedEvents();
          const filteredNewEvents = newEvents.filter((event) =>
            locallyBookmarkedIds.includes(event.id),
          );
          setEvents((prevEvents) => [...prevEvents, ...filteredNewEvents]);
          // Skip advances by the number of items *fetched from API*, not just the filtered ones added to display.
          // This ensures we fetch the next block of data correctly.
          setSkip((prevSkip) => prevSkip + newEvents.length);
        } else {
          setEvents((prevEvents) => [...prevEvents, ...newEvents]);
          setSkip((prevSkip) => prevSkip + newEvents.length);
        }
      } else {
        console.warn(
          "API response for load more did not contain expected 'items' array:",
          responseData,
        );
      }
    } catch (err) {
      console.error("Failed to load more events:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to load more events: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggleInCard = (eventId: string, newBookmarkState: boolean) => {
    if (newBookmarkState) {
      addBookmark(eventId);
    } else {
      removeBookmark(eventId);
    }
    const updatedBookmarks = getBookmarkedEvents();
    setBookmarkedEventIds(updatedBookmarks); // Update the central list of bookmarked IDs

    // If viewing bookmarks and an event is unbookmarked, remove it from the currently displayed list
    if (isBookmarksActive && !newBookmarkState) {
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
    }
  };

  // Filter events for display if isBookmarksActive is true
  const displayedEvents = events; // Already filtered in fetch/load more if isBookmarksActive

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 min-h-[100dvh]">
      {/* Use container for centering and padding */}
      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        countryFilter={countryFilter}
        setCountryFilter={(newCountryFilter) => {
          setCountryFilter(newCountryFilter === countryFilter ? "" : newCountryFilter);
          setIsBookmarksActive(false);
        }}
        sortConfig={sortConfig} // Pass new sortConfig state
        setSortConfig={(newSortConfig) => {
          setSortConfig(newSortConfig === sortConfig ? null : newSortConfig);
          setIsBookmarksActive(false);
        }} // Pass new setter
        isSearchActive={isSearchActive}
        setIsSearchActive={(newIsSearchActive) => {
          setCountryFilter("");
          setSortConfig(null);
          setSearchTerm("");
          setIsSearchActive(newIsSearchActive);
          setIsBookmarksActive(false);
        }}
        isBookmarksActive={isBookmarksActive}
        setIsBookmarksActive={(newIsBookmarksActive) => {
          setCountryFilter("");
          setSortConfig(null);
          setSearchTerm(""); // <-- ADDED: Clear search term
          setIsSearchActive(false); // <-- ADDED: Deactivate search view
          setIsBookmarksActive(newIsBookmarksActive);
        }}
      />
      <main>
        {/* Removed the h2 for Events List, layout implies it */}
        {loading && <p className="text-center py-10 min-h-[100dvh]">Loading events...</p>}
        {error && <p className="text-center text-red-600 py-10">Error: {error}</p>}
        {/* Display no results message */}
        {!loading && !error && events.length === 0 && (
          <p className="text-center py-10 text-gray-500 min-h-[100dvh]">
            {isBookmarksActive
              ? "No bookmarked events found."
              : debouncedSearchTerm
                ? `No events found for "${debouncedSearchTerm}".`
                : "No events found."}
          </p>
        )}
        {/* Render event cards - wrapped in Link */}
        {!loading && !error && displayedEvents.length > 0 && (
          <div className="space-y-6">
            {displayedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} passHref>
                <EventCard
                  event={event}
                  isBookmarkedInitial={bookmarkedEventIds.includes(event.id)}
                  onBookmarkToggle={handleBookmarkToggleInCard}
                />
              </Link>
            ))}
          </div>
        )}
        {/* "Load More" button - Show if not loading, there are events, and not all events are loaded */}
        {/* Adjust "Load More" visibility for bookmarks: show if skip < totalEvents,
            as events.length might be small due to filtering but more items can be loaded from API */}
        {!loading && displayedEvents.length > 0 && skip < totalEvents && (
          <div className="text-center mt-8">
            <Button variant="default" size="lg" onClick={handleLoadMore} disabled={loading}>
              {loading ? "Ładowanie..." : "Pokaż więcej"}
            </Button>
          </div>
        )}
        {!loading && isBookmarksActive && displayedEvents.length === 0 && skip < totalEvents && (
          <div className="text-center mt-8">
            <p className="text-gray-500 mb-4">
              Na tej stronie nie ma więcej zapisanych wydarzeń. Spróbuj załadować więcej, aby
              zobaczyć, czy pojawią się inne zapisane wydarzenia.
            </p>
            <Button variant="default" size="lg" onClick={handleLoadMore} disabled={loading}>
              {loading ? "Ładowanie..." : "Load More Events"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;

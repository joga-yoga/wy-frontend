"use client"; // Add this line for client-side rendering

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
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
import CustomCalendarIcon from "@/components/icons/CustomCalendarIcon";
import CustomPriceIcon from "@/components/icons/CustomPriceIcon";
import CustomSearchIcon from "@/components/icons/CustomSearchIcon";
import CustomSmallCalendarIcon from "@/components/icons/CustomSmallCalendarIcon";
import PolandFlagIcon from "@/components/icons/flags/PolandFlagIcon"; // Import PolandFlagIcon
import { Button } from "@/components/ui/button"; // Import shadcn Button
import { Input } from "@/components/ui/input";
import { useEventsFilter } from "@/context/EventsFilterContext"; // Import context
import { axiosInstance } from "@/lib/axiosInstance"; // Import axios instance
import { cn } from "@/lib/utils";

// Define the structure of a Location object based on the API response
interface Location {
  id: string;
  title: string | null;
  country: string | null;
}

// Define the structure of an event based on the API response
interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: Location | null;
  price: number | null;
  image_ids?: string[];
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
}

// --- SortConfig interface is now imported from EventsFilterContext ---

// --- Updated Filters Component ---
// No longer needs most props, will use context
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

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchActiveAndReset(false);
      }
    };

    if (isSearchActive) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchActive, setIsSearchActiveAndReset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsSearchActiveAndReset(false);
      }
    };

    if (isSearchActive) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchActive, setIsSearchActiveAndReset]);

  const countrySwiperRef = useRef<SwiperClass | null>(null);
  const slidesPerViewCountries = 5;
  const initialSlideCountries = Math.max(0, filterItems.length - slidesPerViewCountries);

  const [hideCountryPrev, setHideCountryPrev] = useState(
    // true
    false,
  );
  const [hideCountryNext, setHideCountryNext] = useState(
    // filterItems.length <= slidesPerViewCountries,
    false,
  );

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
        <div
          // className="w-[calc(100%-280px-40px)]"
          className="w-full relative"
        >
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
            onClick={() => setSortConfigAndReset({ field: "start_date", order: "asc" })} // Simplified, logic is in context
          >
            <CustomCalendarIcon className="h-[88px] w-[88px]" />
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
            onClick={() => setSortConfigAndReset({ field: "price", order: "desc" })} // Simplified, logic is in context
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
          "container mx-auto items-center py-5 relative gap-1 h-[120px] hidden",
          isSearchActive && "flex",
        )}
      >
        <div className="relative flex-grow w-full">
          <Input
            type="search"
            ref={searchInputRef}
            placeholder="Search events..."
            className="pl-[52px] w-full md:text-xl rounded-[44px] h-[64px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (endDate.getTime() < startDate.getTime()) return null;
      if (durationDays <= 0) durationDays = 1;
    } else {
      durationDays = 1;
    }

    const pricePerDay = price / durationDays;
    return `${Math.round(pricePerDay)} zł./dobę`;
  } catch (e) {
    console.error("Error calculating price per day:", e);
    return null;
  }
};

interface EventCardProps {
  event: Event;
  isBookmarkedInitial: boolean;
  onBookmarkToggle: (eventId: string, isBookmarked: boolean) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isBookmarkedInitial, onBookmarkToggle }) => {
  const baseImageUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo"}/image/upload/`;
  const placeholderImageUrl = `https://via.placeholder.com/616x380?text=No+Image`;

  const displayCountry = event.location?.country || "Lokalizacja N/A";
  const displayLocationTitle = event.location?.title || "";

  const [hidePrev, setHidePrev] = useState(true);
  const [hideNext, setHideNext] = useState(!(event.image_ids && event.image_ids.length > 1));

  const [isBookmarkedLocal, setIsBookmarkedLocal] = useState(isBookmarkedInitial);

  useEffect(() => {
    setIsBookmarkedLocal(isBookmarkedInitial);
  }, [isBookmarkedInitial]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newBookmarkState = !isBookmarkedLocal;
    setIsBookmarkedLocal(newBookmarkState);
    onBookmarkToggle(event.id, newBookmarkState);
  };

  const updateNavVisibility = (swiper: SwiperClass) => {
    setHidePrev(swiper.isBeginning);
    setHideNext(swiper.isEnd);
  };

  const prevButtonClass = `event-swiper-prev-${event.id}`;
  const nextButtonClass = `event-swiper-next-${event.id}`;

  return (
    <div className="box-border flex flex-col items-start p-[22px] gap-[22px] w-full bg-white border-[4px] border-gray-50 shadow-[0px_8px_16px_8px_#FAFAFA] rounded-[22px]">
      <div className="flex flex-row items-center p-0 gap-4 w-full h-[55px] self-stretch">
        <div className="flex flex-row justify-center items-center p-0 bg-gray-100 px-6 py-1.5 rounded-[4px] gap-3">
          <CustomSmallCalendarIcon className="w-[32px] h-[32px]" />{" "}
          <span className="text-h-middle text-black whitespace-nowrap">
            {formatDateRange(event.start_date, event.end_date)}
          </span>
        </div>
        <div className="flex flex-row items-center p-0 gap-2">
          {event.location?.country?.toLowerCase() === "polska" ||
          event.location?.country?.toLowerCase() === "poland" ? (
            <PolandFlagIcon className="w-[44px] h-[44px] rounded-full object-cover border border-gray-300" />
          ) : null}
          <span className="text-descr-under-big-head text-gray-500 whitespace-nowrap">
            {displayCountry}
          </span>
        </div>
        <div className="flex-grow"></div>
        <div className="w-[44px] h-[44px] flex items-center justify-center">
          <button onClick={handleBookmarkClick} aria-label="Toggle bookmark" className="p-2">
            {isBookmarkedLocal ? (
              <ActiveBookmarkIcon className="w-[44px] h-[44px] text-brand-green" />
            ) : (
              <BookmarkIcon className="w-[44px] h-[44px] cursor-pointer" />
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center p-0 gap-[45px] w-full self-stretch">
        <div className="flex flex-col gap-[12px] w-full md:w-[485px] flex-shrink-0">
          <div className="relative w-full h-[300px] rounded-[11px] overflow-hidden">
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
                        sizes="(max-width: 768px) 100vw, 485px"
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
                  sizes="(max-width: 768px) 100vw, 485px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
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
        <div className="flex flex-col justify-center items-start gap-[12px] flex-grow self-stretch md:h-[300px] pt-[8px] md:pt-0">
          <div className="flex flex-col items-start gap-3 w-full">
            <h2 className="text-h-middle text-gray-800 self-stretch line-clamp-2">
              {event.title || "Tytuł Wydarzenia"}
            </h2>
            <p className="text-descrip-under-header text-gray-500 self-stretch line-clamp-3 sm:line-clamp-4 md:line-clamp-5">
              {event.description || "Brak opisu."}
            </p>
          </div>
          <div className="flex-grow"></div>
          <div className="flex flex-col justify-center items-end w-full self-stretch gap-0">
            <div className="flex flex-row justify-end items-center w-full h-[30px]">
              <span className="text-middle-header-22 text-right text-gray-700 flex-grow">
                {event.price !== null ? `od ${event.price} ${event.currency || "PLN"}` : "Cena N/A"}
              </span>
            </div>
            {event.price !== null && event.start_date && (
              <div className="flex flex-row justify-end items-center w-full h-[22px]">
                <span className="text-sub-descript-18 text-gray-400 text-right flex-grow">
                  {calculatePricePerDay(event.price, event.start_date, event.end_date)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const mapApiItemToEvent = (item: any): Event => ({
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
});

const EVENTS_PER_PAGE = 10;

// Component that uses the context
const EventsPageContent: React.FC = () => {
  const {
    debouncedSearchTerm,
    countryFilter,
    sortConfig,
    isBookmarksActive,
    bookmarkedEventIds,
    addBookmark,
    removeBookmark,
  } = useEventsFilter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);

  // Fetch events - depends on context values
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      setSkip(0); // Reset skip for new fetches

      try {
        if (isBookmarksActive) {
          if (bookmarkedEventIds.length === 0) {
            setEvents([]);
            setTotalEvents(0);
            setLoading(false);
            return;
          }

          console.log(`Fetching bookmarked events by IDs:`, bookmarkedEventIds);
          const response = await axiosInstance.post(`/events/public/by-ids`, {
            event_ids: bookmarkedEventIds,
          });

          if (response.data && Array.isArray(response.data)) {
            const processedEvents = response.data.map(mapApiItemToEvent);
            setEvents(processedEvents);
            setTotalEvents(processedEvents.length);
            setSkip(processedEvents.length); // All bookmarked events are loaded
          } else {
            setEvents([]);
            setTotalEvents(0);
          }
        } else {
          const params = new URLSearchParams();
          if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
          if (countryFilter) params.append("country", countryFilter);
          if (sortConfig && sortConfig.field && sortConfig.order) {
            params.append("sortBy", sortConfig.field);
            params.append("sortOrder", sortConfig.order);
          }
          params.append("limit", EVENTS_PER_PAGE.toString());
          params.append("skip", "0");

          const apiUrl = `/events/public?${params.toString()}`;
          console.log(`Fetching initial/filtered events from: ${apiUrl}`);
          const response = await axiosInstance.get(apiUrl);
          const responseData = response.data;

          if (
            responseData &&
            typeof responseData === "object" &&
            Array.isArray(responseData.items)
          ) {
            const processedEvents = responseData.items.map(mapApiItemToEvent);
            setEvents(processedEvents);
            setTotalEvents(responseData.total || 0);
            setSkip(processedEvents.length);
          } else {
            setEvents([]);
            setTotalEvents(0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Failed to fetch events: ${errorMessage}. Please try again.`);
        setEvents([]);
        setTotalEvents(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [debouncedSearchTerm, countryFilter, sortConfig, isBookmarksActive, bookmarkedEventIds]);

  const handleLoadMore = async () => {
    if (loading || skip >= totalEvents) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (countryFilter) params.append("country", countryFilter);
      if (sortConfig && sortConfig.field && sortConfig.order) {
        params.append("sortBy", sortConfig.field);
        params.append("sortOrder", sortConfig.order);
      }
      params.append("limit", EVENTS_PER_PAGE.toString());
      params.append("skip", skip.toString());

      const apiUrl = `/events/public?${params.toString()}`;
      console.log(`Loading more events from: ${apiUrl}`);
      const response = await axiosInstance.get(apiUrl);
      const responseData = response.data;

      if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
        const newEventsData: Event[] = responseData.items.map(mapApiItemToEvent);

        setEvents((prevEvents) => [...prevEvents, ...newEventsData]);
        setSkip((prevSkip) => prevSkip + newEventsData.length);
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

    // If viewing bookmarks and an event is unbookmarked, remove it from the currently displayed list
    // This filtering is now more robust as it relies on bookmarkedEventIds from context for re-filtering if needed
    if (isBookmarksActive && !newBookmarkState) {
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
    }
  };

  // displayedEvents will be filtered by the fetch logic if isBookmarksActive.
  // Or, we can re-filter here based on context for absolute certainty after toggles.
  // For simplicity, the primary filtering now happens in the useEffect that fetches data.
  // However, for immediate UI update when unbookmarking while in bookmark view:
  const displayedEvents = isBookmarksActive
    ? events.filter((event) => bookmarkedEventIds.includes(event.id))
    : events;

  return (
    <div className="container mx-auto px-12 pt-2 pb-8 min-h-[100dvh]">
      <Filters /> {/* Filters component now uses context, no props needed here */}
      <main>
        {loading && events.length === 0 && (
          <p className="text-center py-10 min-h-[100dvh]">Loading events...</p>
        )}
        {error && <p className="text-center text-red-600 py-10">Error: {error}</p>}
        {!loading && !error && displayedEvents.length === 0 && (
          <p className="text-center py-10 text-gray-500 min-h-[100dvh]">
            {isBookmarksActive
              ? "No bookmarked events found."
              : debouncedSearchTerm
                ? `No events found for "${debouncedSearchTerm}".`
                : "No events found."}
          </p>
        )}
        {!loading && !error && displayedEvents.length > 0 && (
          <div className="flex flex-col gap-6">
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
        {!loading && displayedEvents.length > 0 && skip < totalEvents && (
          <div className="text-center mt-8">
            <Button variant="default" size="lg" onClick={handleLoadMore} disabled={loading}>
              {loading ? "Ładowanie..." : "Pokaż więcej"}
            </Button>
          </div>
        )}
        {/* Special "Load More" for bookmarks when current page is empty but more items might exist */}
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

// Main page component that wraps content with the provider
const EventsPage: React.FC = () => {
  return <EventsPageContent />;
};

export default EventsPage;

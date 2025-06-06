"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { addBookmark, getBookmarkedEvents, removeBookmark } from "@/lib/bookmarks";

// Define the structure of SortConfig
export interface SortConfig {
  field: "price" | "start_date" | null;
  order: "asc" | "desc" | null;
}

// Define the shape of the context state
interface EventsFilterContextState {
  searchTerm: string;
  debouncedSearchTerm: string;
  countryFilter: string;
  sortConfig: SortConfig | null;
  isSearchActive: boolean;
  isBookmarksActive: boolean;
  bookmarkedEventIds: string[];
  setSearchTerm: (term: string) => void;
  setCountryFilterAndReset: (country: string) => void;
  setSortConfigAndReset: (config: SortConfig | null) => void;
  setIsSearchActiveAndReset: (isActive: boolean) => void;
  toggleBookmarksView: () => void;
  updateBookmarkedIds: () => void;
}

// Create the context with a default undefined value
const EventsFilterContext = createContext<EventsFilterContextState | undefined>(undefined);

// Define props for the provider
interface EventsFilterProviderProps {
  children: ReactNode;
}

// Create the Provider component
export const EventsFilterProvider: React.FC<EventsFilterProviderProps> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [isBookmarksActive, setIsBookmarksActive] = useState<boolean>(false);
  const [bookmarkedEventIds, setBookmarkedEventIds] = useState<string[]>([]);

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Fetch bookmarked event IDs from localStorage
  const updateBookmarkedIds = useCallback(() => {
    setBookmarkedEventIds(getBookmarkedEvents());
  }, []);

  useEffect(() => {
    updateBookmarkedIds();
  }, [isBookmarksActive, updateBookmarkedIds]);

  // Handlers that also reset other filters
  const setCountryFilterAndReset = (newCountryFilter: string) => {
    setCountryFilter((prevCountryFilter) =>
      newCountryFilter === prevCountryFilter ? "" : newCountryFilter,
    );
    setIsBookmarksActive(false);
    // Keep search term and sort config as they can be complementary
  };

  const setSortConfigAndReset = (newSortConfig: SortConfig | null) => {
    // Toggle logic for sort:
    // If same field and asc -> desc
    // If same field and desc -> null (clear)
    // If new field or current is null -> asc
    if (newSortConfig && sortConfig && newSortConfig.field === sortConfig.field) {
      if (sortConfig.order === "asc") {
        setSortConfig({ field: newSortConfig.field, order: "desc" });
      } else {
        setSortConfig(null); // Clear sort
      }
    } else if (newSortConfig) {
      setSortConfig({
        field: newSortConfig.field,
        order: newSortConfig.field === "price" ? "desc" : "asc",
      });
    } else {
      setSortConfig(null);
    }
    setIsBookmarksActive(false);
    // Keep search term and country filter
  };

  const setIsSearchActiveAndReset = (newIsSearchActive: boolean) => {
    setIsSearchActive(newIsSearchActive);
    if (newIsSearchActive) {
      // Optionally clear other filters when activating search, or preserve them
      // setCountryFilter("");
      // setSortConfig(null);
      // setIsBookmarksActive(false);
    } else {
      // When search is deactivated, clear the search term
      setSearchTerm("");
    }
  };

  const toggleBookmarksView = () => {
    const newIsBookmarksActive = !isBookmarksActive;
    setIsBookmarksActive(newIsBookmarksActive);
    if (newIsBookmarksActive) {
      setCountryFilter("");
      setSortConfig(null);
      setSearchTerm("");
      setIsSearchActive(false);
    }
    // When toggling bookmarks, ensure the list is up-to-date
    if (newIsBookmarksActive) {
      updateBookmarkedIds();
    }
  };

  const value = {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    countryFilter,
    setCountryFilterAndReset,
    sortConfig,
    setSortConfigAndReset,
    isSearchActive,
    setIsSearchActiveAndReset,
    isBookmarksActive,
    toggleBookmarksView,
    bookmarkedEventIds,
    updateBookmarkedIds,
  };

  return <EventsFilterContext.Provider value={value}>{children}</EventsFilterContext.Provider>;
};

// Create a custom hook to use the EventsFilter context
export const useEventsFilter = (): EventsFilterContextState => {
  const context = useContext(EventsFilterContext);
  if (context === undefined) {
    throw new Error("useEventsFilter must be used within an EventsFilterProvider");
  }
  return context;
};

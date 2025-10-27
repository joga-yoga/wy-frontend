"use client"; // Add this line for client-side rendering

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Link from "next/link"; // Import Link from next/link
import { useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button"; // Import shadcn Button
import { Separator } from "@/components/ui/separator";
import { useEventsFilter } from "@/context/EventsFilterContext"; // Import context
import { axiosInstance } from "@/lib/axiosInstance"; // Import axios instance

import EventCard from "./components/EventCard";
import Filters from "./components/Filters";
import { Event } from "./types";

const EVENTS_PER_PAGE = 10;

const EventsPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const { debouncedSearchTerm, locationFilter, sortConfig, isBookmarksActive, bookmarkedEventIds } =
    useEventsFilter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);

  const getBookmarkedEvents = useCallback(async () => {
    if (bookmarkedEventIds.length === 0) return [];
    const response = await axiosInstance.post(`/retreats/public/by-ids`, {
      event_ids: bookmarkedEventIds,
    });
    return response.data;
  }, [bookmarkedEventIds]);

  // Fetch bookmarked events
  useEffect(() => {
    const fetchBookmarkedEvents = async () => {
      if (!isBookmarksActive) return;
      setLoading(true);
      setError(null);
      setSkip(0);

      try {
        const response = await getBookmarkedEvents();

        if (response && Array.isArray(response)) {
          const processedEvents = response as Event[];
          setEvents(processedEvents);
          setTotalEvents(processedEvents.length);
          setSkip(processedEvents.length);
        } else {
          setEvents([]);
          setTotalEvents(0);
        }
        setLoading(false);
      } catch (err) {
        console.error("Nie udało się załadować wyjazdów:", err);
        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
        setError(`Nie udało się załadować wyjazdów: ${errorMessage}. Proszę spróbować ponownie.`);
        setEvents([]);
        setTotalEvents(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedEvents();
  }, [isBookmarksActive, getBookmarkedEvents]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (isBookmarksActive) return;
      setLoading(true);
      setError(null);
      setSkip(0);

      try {
        const params = new URLSearchParams();

        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
        if (locationFilter?.country) params.append("country", locationFilter.country);
        if (locationFilter?.state_province)
          params.append("state_province", locationFilter.state_province);

        const urlCountry = searchParams.get("country");
        if (urlCountry && !locationFilter?.country) params.append("country", urlCountry);

        const startDateFrom = searchParams.get("start_date_from");
        if (startDateFrom) params.append("start_date_from", startDateFrom);

        const startDateTo = searchParams.get("start_date_to");
        if (startDateTo) params.append("start_date_to", startDateTo);

        const priceMin = searchParams.get("price_min");
        if (priceMin) params.append("price_min", priceMin);

        const priceMax = searchParams.get("price_max");
        if (priceMax) params.append("price_max", priceMax);

        const language = searchParams.get("language");
        if (language) params.append("language", language);

        if (sortConfig && sortConfig.field && sortConfig.order) {
          params.append("sortBy", sortConfig.field);
          params.append("sortOrder", sortConfig.order);
        } else {
          params.append("sortBy", "published_at");
          params.append("sortOrder", "desc");
        }
        params.append("limit", EVENTS_PER_PAGE.toString());
        params.append("skip", "0");

        const apiUrl = `/retreats/public?${params.toString()}`;
        const response = await axiosInstance.get(apiUrl);
        const responseData = response.data;

        if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
          const processedEvents = responseData.items as Event[];
          setEvents(processedEvents);
          setTotalEvents(responseData.total || 0);
          setSkip(processedEvents.length);
        } else {
          setEvents([]);
          setTotalEvents(0);
        }
      } catch (err) {
        console.error("Nie udało się załadować wyjazdów:", err);
        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
        setError(`Nie udało się załadować wyjazdów: ${errorMessage}. Proszę spróbować ponownie.`);
        setEvents([]);
        setTotalEvents(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [debouncedSearchTerm, locationFilter, sortConfig, isBookmarksActive, searchParams]);

  const handleLoadMore = async () => {
    if (loading || skip >= totalEvents || isLoadingMore) return;

    setIsLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (locationFilter?.country) params.append("country", locationFilter.country);
      if (locationFilter?.state_province)
        params.append("state_province", locationFilter.state_province);

      const urlCountry = searchParams.get("country");
      if (urlCountry && !locationFilter?.country) params.append("country", urlCountry);

      const startDateFrom = searchParams.get("start_date_from");
      if (startDateFrom) params.append("start_date_from", startDateFrom);

      const startDateTo = searchParams.get("start_date_to");
      if (startDateTo) params.append("start_date_to", startDateTo);

      const priceMin = searchParams.get("price_min");
      if (priceMin) params.append("price_min", priceMin);

      const priceMax = searchParams.get("price_max");
      if (priceMax) params.append("price_max", priceMax);

      const language = searchParams.get("language");
      if (language) params.append("language", language);

      if (sortConfig && sortConfig.field && sortConfig.order) {
        params.append("sortBy", sortConfig.field);
        params.append("sortOrder", sortConfig.order);
      } else {
        params.append("sortBy", "published_at");
        params.append("sortOrder", "desc");
      }
      params.append("limit", EVENTS_PER_PAGE.toString());
      params.append("skip", skip.toString());

      const apiUrl = `/retreats/public?${params.toString()}`;
      console.log(`Loading more events from: ${apiUrl}`);
      const response = await axiosInstance.get(apiUrl);
      const responseData = response.data;

      if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
        const newEventsData: Event[] = responseData.items;

        setEvents((prevEvents) => [...prevEvents, ...newEventsData]);
        setSkip((prevSkip) => prevSkip + newEventsData.length);
      }
    } catch (err) {
      console.error("Failed to load more events:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(
        `Nie udało się załadować więcej wyjazdów: ${errorMessage}. Proszę spróbować ponownie.`,
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="">
      <Suspense>
        <Filters />
      </Suspense>
      <main className="container-wy mx-auto px-0 md:px-8 pt-0 md:pt-5 pb-[calc(72px+1px+20px)] md:pb-8">
        {loading && events.length === 0 && (
          <p className="text-center py-10">Ładowanie wyjazdów...</p>
        )}
        {error && <p className="text-center text-red-600 py-10">Error: {error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="text-center py-10 text-gray-500">
            {isBookmarksActive
              ? "Nie znaleziono zapisanych wyjazdów."
              : debouncedSearchTerm
                ? `Nie znaleziono wyjazdów dla "${debouncedSearchTerm}".`
                : "Nie znaleziono wyjazdów."}
          </p>
        )}
        {!loading && !error && events.length > 0 && (
          <div className="flex flex-col gap-3 md:gap-6">
            {events.map((event, index) => (
              <React.Fragment key={event.id}>
                <Link href={`/retreats/${event.id}`} passHref>
                  <EventCard event={event} />
                </Link>
                {index < events.length - 1 && (
                  <div className="w-full px-5">
                    <Separator className="bg-gray-400" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {events.length > 0 && skip < totalEvents && !isBookmarksActive && (
          <div className="text-center mt-8">
            <Button variant="default" size="lg" onClick={handleLoadMore} disabled={loading}>
              {isLoadingMore ? "Ładowanie..." : "Pokaż więcej"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

const EventsPage: React.FC = () => {
  return (
    <Suspense>
      <EventsPageContent />
    </Suspense>
  );
};

export default EventsPage;

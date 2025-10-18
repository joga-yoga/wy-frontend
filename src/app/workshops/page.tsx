"use client";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { axiosInstance } from "@/lib/axiosInstance";

import { mapApiItemToEvent } from "../retreats/helpers";
import { Event } from "../retreats/types";
import Filters from "./components/Filters";
import { WorkshopCard } from "./WorkshopCard";

const EVENTS_PER_PAGE = 10;

const WorkshopsPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const { debouncedSearchTerm, sortConfig, isBookmarksActive, bookmarkedEventIds } =
    useEventsFilter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);

  const getBookmarkedEvents = useCallback(async () => {
    if (bookmarkedEventIds.length === 0) return [];
    const response = await axiosInstance.post(`/workshops/public/by-ids`, {
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
          const processedEvents = response.map(mapApiItemToEvent);
          setEvents(processedEvents);
          setTotalEvents(processedEvents.length);
          setSkip(processedEvents.length);
        } else {
          setEvents([]);
          setTotalEvents(0);
        }
        setLoading(false);
      } catch (err) {
        console.error("Nie udało się załadować warsztatów:", err);
        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
        setError(`Nie udało się załadować warsztatów: ${errorMessage}. Proszę spróbować ponownie.`);
        setEvents([]);
        setTotalEvents(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedEvents();
  }, [isBookmarksActive, getBookmarkedEvents]);

  // Fetch workshops
  useEffect(() => {
    const fetchEvents = async () => {
      if (isBookmarksActive) return;
      setLoading(true);
      setError(null);
      setSkip(0);

      try {
        const params = new URLSearchParams();

        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);

        const city = searchParams.get("city");
        if (city) params.append("cities", city);

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

        const tags = searchParams.get("tags");
        if (tags) params.append("tags", tags);

        const isOnline = searchParams.get("is_online");
        if (isOnline === "true" || isOnline === "false") params.append("is_online", isOnline);
        const isOnsite = searchParams.get("is_onsite");
        if (isOnsite === "true" || isOnsite === "false") params.append("is_onsite", isOnsite);

        if (sortConfig && sortConfig.field && sortConfig.order) {
          params.append("sortBy", sortConfig.field);
          params.append("sortOrder", sortConfig.order);
        } else {
          params.append("sortBy", "published_at");
          params.append("sortOrder", "desc");
        }
        params.append("limit", EVENTS_PER_PAGE.toString());
        params.append("skip", "0");

        const apiUrl = `/workshops/public?${params.toString()}`;
        console.log(`Fetching initial/filtered workshops from: ${apiUrl}`);
        const response = await axiosInstance.get(apiUrl);
        const responseData = response.data;

        if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
          const processedEvents = responseData.items.map(mapApiItemToEvent);
          setEvents(processedEvents);
          setTotalEvents(responseData.total || 0);
          setSkip(processedEvents.length);
        } else {
          setEvents([]);
          setTotalEvents(0);
        }
      } catch (err) {
        console.error("Nie udało się załadować warsztatów:", err);
        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
        setError(`Nie udało się załadować warsztatów: ${errorMessage}. Proszę spróbować ponownie.`);
        setEvents([]);
        setTotalEvents(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [debouncedSearchTerm, sortConfig, isBookmarksActive, searchParams]);

  const handleLoadMore = async () => {
    if (loading || skip >= totalEvents || isLoadingMore) return;

    setIsLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);

      const city = searchParams.get("city");
      if (city) params.append("cities", city);

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

      const tags = searchParams.get("tags");
      if (tags) params.append("tags", tags);

      const isOnline = searchParams.get("is_online");
      if (isOnline === "true" || isOnline === "false") params.append("is_online", isOnline);
      const isOnsite = searchParams.get("is_onsite");
      if (isOnsite === "true" || isOnsite === "false") params.append("is_onsite", isOnsite);

      if (sortConfig && sortConfig.field && sortConfig.order) {
        params.append("sortBy", sortConfig.field);
        params.append("sortOrder", sortConfig.order);
      } else {
        params.append("sortBy", "published_at");
        params.append("sortOrder", "desc");
      }
      params.append("limit", EVENTS_PER_PAGE.toString());
      params.append("skip", skip.toString());

      const apiUrl = `/workshops/public?${params.toString()}`;
      console.log(`Loading more workshops from: ${apiUrl}`);
      const response = await axiosInstance.get(apiUrl);
      const responseData = response.data;

      if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
        const newEventsData: Event[] = responseData.items.map(mapApiItemToEvent);

        setEvents((prevEvents) => [...prevEvents, ...newEventsData]);
        setSkip((prevSkip) => prevSkip + newEventsData.length);
      }
    } catch (err) {
      console.error("Failed to load more workshops:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(
        `Nie udało się załadować więcej warsztatów: ${errorMessage}. Proszę spróbować ponownie.`,
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
          <p className="text-center py-10">Ładowanie warsztatów...</p>
        )}
        {error && <p className="text-center text-red-600 py-10">Error: {error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="text-center py-10 text-gray-500">Nie znaleziono warsztatów.</p>
        )}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {events.map((event, index) => (
              <React.Fragment key={event.id}>
                <Link href={`/${event.id}`} passHref>
                  <WorkshopCard event={event} />
                </Link>
                {index < events.length - 1 && (
                  <div className="w-full px-5 md:hidden">
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

const WorkshopsPage: React.FC = () => {
  return (
    <Suspense>
      <WorkshopsPageContent />
    </Suspense>
  );
};

export default WorkshopsPage;

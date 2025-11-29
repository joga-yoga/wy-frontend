"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { Event } from "@/app/retreats/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { axiosInstance } from "@/lib/axiosInstance";

import { WorkshopCard } from "../WorkshopCard";

interface WorkshopsListProps {
  initialEvents: Event[];
  initialTotal: number;
}

const EVENTS_PER_PAGE = 10;

const WorkshopsList: React.FC<WorkshopsListProps> = ({ initialEvents, initialTotal }) => {
  const searchParams = useSearchParams();
  const { debouncedSearchTerm, isBookmarksActive, bookmarkedEventIds } = useEventsFilter();

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState<number>(initialEvents.length);
  const [totalEvents, setTotalEvents] = useState<number>(initialTotal);

  // Sync with server data when URL params change (reflected in initialEvents)
  // But only if bookmarks are NOT active
  useEffect(() => {
    if (!isBookmarksActive) {
      setEvents(initialEvents);
      setTotalEvents(initialTotal);
      setSkip(initialEvents.length);
      setError(null);
    }
  }, [initialEvents, initialTotal, isBookmarksActive]);

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

  const handleLoadMore = async () => {
    if (loading || skip >= totalEvents || isLoadingMore) return;

    setIsLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams(searchParams.toString());

      // Override/ensure these params are correct for pagination
      params.set("limit", EVENTS_PER_PAGE.toString());
      params.set("skip", skip.toString());

      const apiUrl = `/workshops/public?${params.toString()}`;
      console.log(`Loading more workshops from: ${apiUrl}`);
      const response = await axiosInstance.get(apiUrl);
      const responseData = response.data;

      if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
        const newEventsData: Event[] = responseData.items;

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

  if (loading && events.length === 0) {
    return <p className="text-center py-10">Ładowanie warsztatów...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 py-10">Error: {error}</p>;
  }

  if (events.length === 0) {
    return (
      <p className="text-center py-10 text-gray-500">
        {isBookmarksActive
          ? "Nie znaleziono zapisanych warsztatów."
          : debouncedSearchTerm
            ? `Nie znaleziono warsztatów dla "${debouncedSearchTerm}".`
            : "Nie znaleziono warsztatów."}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {events.map((event, index) => (
          <React.Fragment key={event.id}>
            <Link href={`/workshops/${event.id}`} passHref>
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
      {events.length > 0 && skip < totalEvents && !isBookmarksActive && (
        <div className="text-center mt-8">
          <Button
            variant="default"
            size="lg"
            onClick={handleLoadMore}
            disabled={loading || isLoadingMore}
          >
            {isLoadingMore ? "Ładowanie..." : "Pokaż więcej"}
          </Button>
        </div>
      )}
    </>
  );
};

export default WorkshopsList;

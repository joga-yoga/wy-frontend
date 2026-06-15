"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { CourseCard, type CourseCardEvent } from "@/app/(public)/courses/CourseCard";
import { Event } from "@/app/(public)/retreats/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { prepareSearchParams } from "@/lib/prepareSearchParams";

import { WorkshopCard } from "../WorkshopCard";

type WorkshopItem = Event & { _type: "workshop" };
type CourseItem = CourseCardEvent & { _type: "course" };
type CombinedItem = WorkshopItem | CourseItem;

interface CombinedEventsListProps {
  initialWorkshops: Event[];
  initialCourses: CourseCardEvent[];
  initialTotal: number;
}

const EVENTS_PER_PAGE = 10;

function mergeAndSort(
  workshops: Event[],
  courses: CourseCardEvent[],
  sortBy: string | null,
  sortOrder: string | null,
): CombinedItem[] {
  const tagged: CombinedItem[] = [
    ...workshops.map((e) => ({ ...e, _type: "workshop" as const })),
    ...courses.map((e) => ({ ...e, _type: "course" as const })),
  ];
  const dir = sortOrder === "desc" ? -1 : 1;
  return tagged.sort((a, b) => {
    if (sortBy === "price") {
      const pa = a.price ?? Infinity;
      const pb = b.price ?? Infinity;
      return (pa - pb) * dir;
    }
    // default: sort by start_date
    if (!a.start_date) return 1;
    if (!b.start_date) return -1;
    return (new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) * dir;
  });
}

const CombinedEventsList: React.FC<CombinedEventsListProps> = ({
  initialWorkshops,
  initialCourses,
  initialTotal,
}) => {
  const searchParams = useSearchParams();
  const { debouncedSearchTerm, isBookmarksActive, bookmarkedEventIds } = useEventsFilter();

  const [workshopEvents, setWorkshopEvents] = useState<Event[]>(initialWorkshops);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(initialWorkshops.length);
  const [totalWorkshops, setTotalWorkshops] = useState(initialTotal);

  // Sync workshops when server re-renders with new filter params (but not in bookmark mode)
  useEffect(() => {
    if (!isBookmarksActive) {
      setWorkshopEvents(initialWorkshops);
      setTotalWorkshops(initialTotal);
      setSkip(initialWorkshops.length);
      setError(null);
    }
  }, [initialWorkshops, initialTotal, isBookmarksActive]);

  const getBookmarkedWorkshops = useCallback(async () => {
    if (bookmarkedEventIds.length === 0) return [];
    const response = await axiosInstance.post("/workshops/public/by-ids", {
      event_ids: bookmarkedEventIds,
    });
    return response.data;
  }, [bookmarkedEventIds]);

  // Bookmark mode: show only bookmarked workshops (courses are not bookmarkable yet)
  useEffect(() => {
    const fetchBookmarked = async () => {
      if (!isBookmarksActive) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getBookmarkedWorkshops();
        const events = Array.isArray(response) ? (response as Event[]) : [];
        setWorkshopEvents(events);
        setTotalWorkshops(events.length);
        setSkip(events.length);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
        setError(`Nie udało się załadować zapisanych warsztatów: ${msg}.`);
        setWorkshopEvents([]);
        setTotalWorkshops(0);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarked();
  }, [isBookmarksActive, getBookmarkedWorkshops]);

  const handleLoadMore = async () => {
    if (loading || skip >= totalWorkshops || isLoadingMore) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", EVENTS_PER_PAGE.toString());
      params.set("skip", skip.toString());
      const prepared = prepareSearchParams(params);
      const response = await axiosInstance.get(`/workshops/public?${prepared.toString()}`);
      const data = response.data;
      if (data && Array.isArray(data.items)) {
        const newEvents: Event[] = data.items;
        setWorkshopEvents((prev) => [...prev, ...newEvents]);
        setSkip((prev) => prev + newEvents.length);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Nie udało się załadować więcej wydarzeń: ${msg}.`);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  // Merge workshops + courses and sort by the active sort params.
  // In bookmark mode, only show workshops (courses are not bookmarkable yet).
  const combined = useMemo(() => {
    const courses = isBookmarksActive ? [] : initialCourses;
    return mergeAndSort(workshopEvents, courses, sortBy, sortOrder);
  }, [workshopEvents, initialCourses, isBookmarksActive, sortBy, sortOrder]);

  if (loading && combined.length === 0) {
    return <p className="text-center py-10">Ładowanie wydarzeń...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 py-10">Error: {error}</p>;
  }

  if (combined.length === 0) {
    return (
      <p className="text-center py-10 text-gray-500">
        {isBookmarksActive
          ? "Nie znaleziono zapisanych warsztatów."
          : debouncedSearchTerm
            ? `Nie znaleziono wydarzeń dla "${debouncedSearchTerm}".`
            : "Nie znaleziono wydarzeń."}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {combined.map((item, index) => (
          <React.Fragment key={item.id}>
            {item._type === "course" ? (
              <Link href={`/kursy/${item.slug}?from=/`} passHref>
                <CourseCard event={item} />
              </Link>
            ) : (
              <Link href={`/wydarzenia/${item.slug}?from=/`} passHref>
                <WorkshopCard event={item} />
              </Link>
            )}
            {index < combined.length - 1 && (
              <div className="w-full px-5 md:hidden">
                <Separator className="bg-gray-400" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {skip < totalWorkshops && !isBookmarksActive && (
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

export default CombinedEventsList;

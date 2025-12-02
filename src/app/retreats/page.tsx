import React, { Suspense } from "react";

import { getRetreats } from "@/lib/api/retreats";

import Filters from "./components/Filters";
import RetreatsList from "./components/RetreatsList";
import { Event } from "./types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const EventsPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;

  // Construct URLSearchParams from the prop
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.append(key, value);
    }
  });

  // Ensure defaults if not present (mirroring client-side defaults)
  if (!params.has("limit")) {
    params.append("limit", "10");
  }
  if (!params.has("skip")) {
    params.append("skip", "0");
  }
  if (!params.has("sortBy")) {
    params.append("sortBy", "published_at");
    params.append("sortOrder", "desc");
  }

  let events: Event[] = [];
  let totalEvents = 0;
  let error = null;

  try {
    const data = await getRetreats(params);
    events = data.items;
    totalEvents = data.total;
  } catch (err) {
    console.error("Failed to fetch retreats on server:", err);
    error = "Failed to load events. Please try again later.";
  }

  return (
    <div className="">
      <Suspense>
        <Filters />
      </Suspense>
      <main className="container-wy mx-auto px-0 md:px-8 pt-0 md:pt-5 pb-[calc(72px+1px+20px)] md:pb-8">
        {error ? (
          <p className="text-center text-red-600 py-10">Error: {error}</p>
        ) : (
          <Suspense fallback={<p className="text-center py-10">Ładowanie wyjazdów...</p>}>
            <RetreatsList initialEvents={events} initialTotal={totalEvents} />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default EventsPage;

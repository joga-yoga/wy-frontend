import { Metadata } from "next";
import React, { Suspense } from "react";

import { Event } from "@/app/(public)/retreats/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { getWorkshops } from "@/lib/api/workshops";
import { buildCollectionJsonLd, buildPageMetadata } from "@/lib/seo";

import Filters from "./components/Filters";
import WorkshopsList from "./components/WorkshopsList";

const pageTitle = "joga.yoga – kalendarz wydarzeń jogowych";
const pageDescription =
  "Aktualne warsztaty, kursy i wydarzenia jogowe zebrane w jednym miejscu. Jasna struktura, uporządkowane dane i dostęp dla organizatorów bez opłat.";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: pageTitle,
    description: pageDescription,
    path: "/",
  }),
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const WorkshopsPage = async (props: PageProps) => {
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

  let events: Event[] = [];
  let totalEvents = 0;
  let error = null;

  try {
    const data = await getWorkshops(params);
    events = data.items;
    totalEvents = data.total;
  } catch (err) {
    console.error("Failed to fetch workshops on server:", err);
    error = "Failed to load workshops. Please try again later.";
  }

  return (
    <div className="">
      <JsonLd
        data={buildCollectionJsonLd({
          project: "workshops",
          path: "/",
          name: pageTitle,
          description: pageDescription,
        })}
      />
      <Suspense>
        <Filters />
      </Suspense>
      <main className="container-wy mx-auto px-0 md:px-8 pt-0 md:pt-5 pb-[calc(72px+1px+20px)] md:pb-8">
        {error ? (
          <p className="text-center text-red-600 py-10">Error: {error}</p>
        ) : (
          <Suspense fallback={<p className="text-center py-10">Ładowanie warsztatów...</p>}>
            <WorkshopsList initialEvents={events} initialTotal={totalEvents} />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default WorkshopsPage;

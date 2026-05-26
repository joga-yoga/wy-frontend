import { Metadata } from "next";
import React, { Suspense } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { getRetreats } from "@/lib/api/retreats";
import { buildCollectionJsonLd, buildPageMetadata } from "@/lib/seo";

import RetreatsList from "./components/RetreatsList";
import { RetreatsPageFilters } from "./components/RetreatsPageFilters";
import { Event } from "./types";

const pageTitle = "Wyjazdy jogowe w Polsce i na świecie – sprawdź aktualne terminy | joga.yoga";
const pageDescription =
  "Odkrywaj najlepsze wyjazdy jogowe, retrity i weekendowe praktyki. Pełne opisy, aktualne terminy i przejrzyste zasady.";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: pageTitle,
    description: pageDescription,
    path: "/wyjazdy",
  }),
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const RetreatsPage = async (props: PageProps) => {
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
    const data = await getRetreats(params);
    events = data.items;
    totalEvents = data.total;
  } catch (err) {
    console.error("Failed to fetch retreats on server:", err);
    error = "Failed to load events. Please try again later.";
  }

  return (
    <div className="">
      <JsonLd
        data={buildCollectionJsonLd({
          project: "retreats",
          path: "/wyjazdy",
          name: pageTitle,
          description: pageDescription,
        })}
      />
      <Suspense>
        <RetreatsPageFilters />
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

export default RetreatsPage;

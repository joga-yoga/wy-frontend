import { Metadata } from "next";
import React, { Suspense } from "react";

import { CourseCardEvent } from "@/app/(public)/courses/CourseCard";
import { Event } from "@/app/(public)/retreats/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCourses } from "@/lib/api/getCourses";
import { getWorkshops } from "@/lib/api/workshops";
import { buildCollectionJsonLd, buildPageMetadata } from "@/lib/seo";

import Filters from "./components/Filters";
import CombinedEventsList from "./components/CombinedEventsList";

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

  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.append(key, value);
    }
  });

  // Pre-load all courses (no pagination needed — small dataset)
  const courseParams = new URLSearchParams(params.toString());
  courseParams.set("limit", "100");

  let events: Event[] = [];
  let totalEvents = 0;
  let courses: CourseCardEvent[] = [];
  let error = null;

  try {
    const [workshopsData, coursesData] = await Promise.all([
      getWorkshops(params),
      getCourses(courseParams).catch((err) => {
        console.error("Failed to fetch courses on server:", err);
        return { items: [], total: 0 };
      }),
    ]);
    events = workshopsData.items;
    totalEvents = workshopsData.total;
    courses = coursesData.items as CourseCardEvent[];
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
          <Suspense fallback={<p className="text-center py-10">Ładowanie wydarzeń...</p>}>
            <CombinedEventsList
              initialWorkshops={events}
              initialCourses={courses}
              initialTotal={totalEvents}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default WorkshopsPage;

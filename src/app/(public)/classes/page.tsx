import { Metadata } from "next";
import React, { Suspense } from "react";

import { Event } from "@/app/(public)/retreats/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { getClasses } from "@/lib/api/classes";
import { buildCollectionJsonLd, buildPageMetadata } from "@/lib/seo";

import ClassesList from "./components/ClassesList";

const pageTitle = "joga.yoga – zajęcia jogi";
const pageDescription = "Aktualne zajęcia jogi w studiach i szkołach jogi.";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: pageTitle,
    description: pageDescription,
    path: "/zajecia",
  }),
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ClassesPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
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
    const data = await getClasses(params);
    events = data.items;
    totalEvents = data.total;
  } catch (err) {
    console.error("Failed to fetch classes on server:", err);
    error = "Failed to load classes. Please try again later.";
  }

  return (
    <div>
      <JsonLd
        data={buildCollectionJsonLd({
          project: "workshops",
          path: "/zajecia",
          name: pageTitle,
          description: pageDescription,
        })}
      />
      <main className="container-wy mx-auto px-0 md:px-8 pt-0 md:pt-5 pb-[calc(72px+1px+20px)] md:pb-8">
        {error ? (
          <p className="text-center text-red-600 py-10">Error: {error}</p>
        ) : (
          <Suspense fallback={<p className="text-center py-10">Ładowanie zajęć...</p>}>
            <ClassesList initialEvents={events} initialTotal={totalEvents} />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default ClassesPage;

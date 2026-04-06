import { Metadata } from "next";
import React, { Suspense } from "react";

import { Event } from "@/app/retreats/types";
import { getClasses } from "@/lib/api/classes";

import ClassesList from "./components/ClassesList";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "wydarzenia.yoga – zajęcia jogi",
  description: "Aktualne zajęcia jogi w studiach i szkołach jogi.",
  openGraph: {
    images: ["/images/social_wydarzenia.png"],
  },
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

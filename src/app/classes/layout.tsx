import { Metadata } from "next";
import { Suspense } from "react";

import { Footer } from "@/components/layout/Footer";
import { PublicHeader } from "@/components/layout/Header";
import { EventsFilterProvider } from "@/context/EventsFilterContext";
import { PROJECT_SEO } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(PROJECT_SEO.workshops.baseUrl),
  title: {
    default: "Zajęcia jogi | wydarzenia.yoga",
    template: "%s",
  },
  description: "Aktualne zajęcia jogi w studiach i szkołach jogi.",
  openGraph: {
    siteName: PROJECT_SEO.workshops.siteName,
    description: "Aktualne zajęcia jogi w studiach i szkołach jogi.",
  },
};

export default function ClassesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <EventsFilterProvider>
        <PublicHeader project="workshops" />
        {children}
        <Footer project="workshops" />
      </EventsFilterProvider>
    </Suspense>
  );
}

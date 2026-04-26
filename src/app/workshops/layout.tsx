import { Metadata } from "next";
import { Suspense } from "react";

import { CookieConsentManager } from "@/components/cookies/CookieConsentManager";
import { Footer } from "@/components/layout/Footer";
import { PublicHeader } from "@/components/layout/Header";
import { EventsFilterProvider } from "@/context/EventsFilterContext";
import { PROJECT_SEO } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(PROJECT_SEO.workshops.baseUrl),
  title: {
    default: "Wydarzenia jogowe | wydarzenia.yoga",
    template: "%s",
  },
  description: "Aktualne warsztaty, kursy, zajęcia jogi i profile organizatorów.",
  openGraph: {
    siteName: PROJECT_SEO.workshops.siteName,
    description: "Aktualne warsztaty, kursy, zajęcia jogi i profile organizatorów.",
  },
};

export default function WorkshopsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <EventsFilterProvider>
        <PublicHeader project="workshops" />
        {children}
        <CookieConsentManager project="workshops" />
        <Footer project="workshops" />
      </EventsFilterProvider>
    </Suspense>
  );
}

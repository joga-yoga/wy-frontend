import { Suspense } from "react";

import { CookieConsentManager } from "@/components/cookies/CookieConsentManager";
import { Footer } from "@/components/layout/Footer";
import { PublicHeader } from "@/components/layout/Header";
import { EventsFilterProvider } from "@/context/EventsFilterContext";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
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

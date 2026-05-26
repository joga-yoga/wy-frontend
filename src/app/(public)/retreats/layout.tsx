import { Metadata } from "next";
import { Suspense } from "react";

import { CookieConsentManager } from "@/components/cookies/CookieConsentManager";
import { Footer } from "@/components/layout/Footer";
import { PublicHeader } from "@/components/layout/Header";
import { EventsFilterProvider } from "@/context/EventsFilterContext";
import { PROJECT_SEO } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(PROJECT_SEO.baseUrl),
  title: {
    default: "Wyjazdy jogowe | joga.yoga",
    template: "%s",
  },
  description: "Aktualne wyjazdy jogowe, retrity i profile organizatorów.",
  openGraph: {
    siteName: PROJECT_SEO.siteName,
    description: "Aktualne wyjazdy jogowe, retrity i profile organizatorów.",
  },
};

export default function RetreatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

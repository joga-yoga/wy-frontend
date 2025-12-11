import { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { PublicHeader } from "@/components/layout/Header";
import { EventsFilterProvider } from "@/context/EventsFilterContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://wydarzenia.yoga"),
  title: "Wydarzenia.Yoga",
  description: "Wydarzenia.Yoga",
  openGraph: {
    description: "Wydarzenia.Yoga",
  },
};

export default function WorkshopsLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventsFilterProvider>
      <PublicHeader project="workshops" />
      {children}
      <Footer project="workshops" />
    </EventsFilterProvider>
  );
}

import { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { PublicHeader } from "@/components/layout/Header";
import { EventsFilterProvider } from "@/context/EventsFilterContext";

export const metadata: Metadata = {
  title: "Wyjazdy.Yoga",
  description: "Wyjazdy.Yoga",
  openGraph: {
    description: "Wyjazdy.Yoga",
  },
};

export default function RetreatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventsFilterProvider>
      <PublicHeader project="retreats" />
      {children}
      <Footer project="retreats" />
    </EventsFilterProvider>
  );
}

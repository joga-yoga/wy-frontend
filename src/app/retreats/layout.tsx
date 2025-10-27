import { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { EventsHeader } from "@/components/layout/Header";
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
      <EventsHeader />
      {children}
      <Footer project="retreats" />
    </EventsFilterProvider>
  );
}

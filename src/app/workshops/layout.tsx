import { Footer } from "@/components/layout/Footer";
import { EventsHeader } from "@/components/layout/Header";
import { EventsFilterProvider } from "@/context/EventsFilterContext";

export default function WorkshopsLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventsFilterProvider>
      <EventsHeader />
      {children}
      <Footer project="workshops" />
    </EventsFilterProvider>
  );
}

import { Footer } from "@/components/layout/Footer";
import { EventsHeader } from "@/components/layout/Header";
import { EventsFilterProvider } from "@/context/EventsFilterContext";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventsFilterProvider>
      <EventsHeader />
      {children}
      <Footer />
    </EventsFilterProvider>
  );
}

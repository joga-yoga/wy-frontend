import { EventsHeader } from "@/components/layout/ProfileHeader";
import { EventsFilterProvider } from "@/context/EventsFilterContext";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventsFilterProvider>
      <EventsHeader />
      {children}
    </EventsFilterProvider>
  );
}

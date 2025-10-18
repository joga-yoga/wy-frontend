import { Carousel } from "@/app/retreats/organizer/[organizerId]/components/Carousel";
import EventCard from "@/app/retreats/organizer/[organizerId]/components/EventCard";
import { OrganizerEvent } from "@/app/retreats/organizer/[organizerId]/types";

interface EventSectionProps {
  title: string;
  events: OrganizerEvent[];
}

export const EventSection = ({ title, events }: EventSectionProps) => {
  return (
    <Carousel title={title} items={events} renderItem={(event) => <EventCard event={event} />} />
  );
};

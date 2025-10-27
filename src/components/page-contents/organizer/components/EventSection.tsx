import { OrganizerEvent } from "../types";
import { Carousel } from "./Carousel";
import EventCard from "./EventCard";

interface EventSectionProps {
  title: string;
  events: OrganizerEvent[];
  project: "retreats" | "workshops";
}

export const EventSection = ({ title, events, project }: EventSectionProps) => {
  return (
    <Carousel
      title={title}
      items={events}
      renderItem={(event) => <EventCard event={event} project={project} />}
    />
  );
};

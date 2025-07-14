"use client";

import { useParams } from "next/navigation";

import { EventSidebar } from "../../components/EventForm/components/EventSidebar";
import { EventForm } from "../../components/EventForm/EventForm";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <>
      <EventSidebar />
      <EventForm eventId={eventId} />
    </>
  );
}

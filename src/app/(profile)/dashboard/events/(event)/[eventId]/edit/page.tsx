"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { EventDashboardSidebar } from "../../components/EventForm/components/EventDashboardSidebar";
import { EventForm } from "../../components/EventForm/EventForm";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col md:flex-row">
      <EventDashboardSidebar isLoading={isLoading} />
      <EventForm eventId={eventId} onLoadingChange={setIsLoading} />
    </div>
  );
}

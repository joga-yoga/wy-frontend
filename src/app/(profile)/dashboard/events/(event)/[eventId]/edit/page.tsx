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
    <>
      <EventDashboardSidebar isLoading={isLoading} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1">
          <EventForm eventId={eventId} onLoadingChange={setIsLoading} />
        </main>
      </div>
    </>
  );
}

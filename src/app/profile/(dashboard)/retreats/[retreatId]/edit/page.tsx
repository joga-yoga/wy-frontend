"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { EventForm } from "../../../components/EventForm";
import { EventDashboardSidebar } from "../../../components/EventForm/components/EventDashboardSidebar";

export default function EditEventPage() {
  const params = useParams();
  const retreatId = params.retreatId as string;
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col md:flex-row">
      <EventDashboardSidebar isLoading={isLoading} />
      <EventForm eventId={retreatId} onLoadingChange={setIsLoading} />
    </div>
  );
}

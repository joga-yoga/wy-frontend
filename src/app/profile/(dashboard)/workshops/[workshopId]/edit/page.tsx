"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { EventForm } from "../../../components/EventForm";
import { EventDashboardSidebar } from "../../../components/EventForm/components/EventDashboardSidebar";

export default function EditWorkshopPage() {
  const params = useParams<{ workshopId: string }>();
  const workshopId = params?.workshopId as string;
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col md:flex-row">
      <EventDashboardSidebar isLoading={isLoading} />
      <EventForm eventId={workshopId} mode="workshop" onLoadingChange={setIsLoading} />
    </div>
  );
}

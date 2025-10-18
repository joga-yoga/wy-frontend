"use client";

import { useParams } from "next/navigation";

import { EventForm } from "../../../components/EventForm";
import { EventDashboardSidebar } from "../../../components/EventForm/components/EventDashboardSidebar";

export default function EditWorkshopPage() {
  const params = useParams<{ workshopId: string }>();
  const workshopId = params?.workshopId as string;

  return (
    <div className="flex flex-col md:flex-row">
      <EventDashboardSidebar isLoading={false} />
      <EventForm eventId={workshopId} mode="workshop" />
    </div>
  );
}

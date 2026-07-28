"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { EventForm } from "../../../components/EventForm";
import { EventDashboardSidebar } from "../../../components/EventForm/components/EventDashboardSidebar";

export default function EditClassPage() {
  const params = useParams<{ classId: string }>();
  const classId = params?.classId as string;
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col md:flex-row">
      <EventDashboardSidebar isLoading={isLoading} />
      <EventForm eventId={classId} mode="class" onLoadingChange={setIsLoading} />
    </div>
  );
}

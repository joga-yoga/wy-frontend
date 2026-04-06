"use client";

import { useState } from "react";

import { EventForm } from "../../components/EventForm";
import { EventDashboardSidebar } from "../../components/EventForm/components/EventDashboardSidebar";

export default function CreateClassPage() {
  const [isFormLoading, setIsFormLoading] = useState(true);

  return (
    <div className="flex flex-col md:flex-row">
      <EventDashboardSidebar isLoading={isFormLoading} />
      <div className="flex-1">
        <EventForm mode="class" onLoadingChange={setIsFormLoading} />
      </div>
    </div>
  );
}

"use client";

import { EventForm } from "@/components/features/events/EventForm";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

export default function CreateEventPage() {
  return (
    <div className="p-6">
      <EventForm />
    </div>
  );
}

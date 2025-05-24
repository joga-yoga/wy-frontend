"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EventForm } from "@/components/features/events/EventForm";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return <EventForm eventId={eventId} />;
}

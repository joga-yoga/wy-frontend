"use client";

import { useParams } from "next/navigation";
import React from "react";

import { OrganizerPageContent } from "@/components/page-contents/organizer/OrganizerPageContent";

export default function OrganizerPage() {
  const params = useParams();
  return <OrganizerPageContent organizerId={params.organizerId as string} />;
}

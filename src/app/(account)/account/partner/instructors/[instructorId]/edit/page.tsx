"use client";

import { useParams } from "next/navigation";

import { InstructorFullProfileForm } from "./InstructorFullProfileForm";

/** Direct-URL entry to the editor. The roster reaches the same form via its own screen. */
export default function InstructorProfileEditPage() {
  const params = useParams<{ instructorId: string }>();
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28">
      <InstructorFullProfileForm instructorId={params.instructorId} />
    </div>
  );
}

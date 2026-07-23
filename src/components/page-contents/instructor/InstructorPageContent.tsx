"use client";

import { useMemo } from "react";

import type { InstructorDetails } from "@/types/instructor";

import { buildInstructorProfileViewModel } from "./components/viewModel";
import { InstructorProfileContent } from "./InstructorProfileContent";

interface InstructorPageContentProps {
  data: InstructorDetails;
}

export function InstructorPageContent({ data }: InstructorPageContentProps) {
  const profile = useMemo(() => buildInstructorProfileViewModel(data), [data]);
  const isPublished = data.instructor.is_published;

  return (
    <InstructorProfileContent
      data={data}
      profile={profile}
      hideBottomAction={!isPublished}
      notice={
        !isPublished ? (
          <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm italic leading-5 text-muted-foreground">
            Ten nauczyciel nie ma jeszcze publicznego profilu na joga.yoga.
          </div>
        ) : undefined
      }
    />
  );
}

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

  return <InstructorProfileContent data={data} profile={profile} />;
}

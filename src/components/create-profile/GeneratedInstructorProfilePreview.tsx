"use client";

import { useMemo } from "react";

import { InstructorProfileContent } from "@/components/page-contents/instructor/InstructorProfileContent";
import type { GeneratedInstructorProfileDraft } from "@/types/instructor";

import { buildInstructorPreviewViewModel } from "./instructorPreviewViewModel";

interface GeneratedInstructorProfilePreviewProps {
  draft: GeneratedInstructorProfileDraft;
  claimHref: string;
}

export function GeneratedInstructorProfilePreview({
  draft,
  claimHref,
}: GeneratedInstructorProfilePreviewProps) {
  const preview = useMemo(() => buildInstructorPreviewViewModel(draft.profile), [draft.profile]);

  return (
    <InstructorProfileContent
      data={draft.profile}
      profile={preview.profile}
      sampleSections={preview.sampleSections}
      notice={
        <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm italic leading-5 text-muted-foreground">
          Profil utworzony automatycznie z publicznych informacji. Elementy oznaczone jako „Dane
          przykładowe” nie pochodzą z wygenerowanego profilu. Załóż konto, aby poprawić dane i
          opublikować profil.
        </div>
      }
      bottomPrimaryAction={{
        label: "Załóż konto i opublikuj",
        href: claimHref,
        hideIcon: true,
      }}
    />
  );
}

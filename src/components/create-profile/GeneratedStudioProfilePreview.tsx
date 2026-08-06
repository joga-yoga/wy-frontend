"use client";

import { StudioPageContent } from "@/components/page-contents/studio/StudioPageContent";
import type { GeneratedStudioProfileDraft } from "@/types/studio";

export function GeneratedStudioProfilePreview({
  draft,
  claimHref,
}: {
  draft: GeneratedStudioProfileDraft;
  claimHref: string;
}) {
  return (
    <StudioPageContent
      studio={draft.profile}
      previewMode
      notice={
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-5 text-zinc-600">
          {draft.error_message ??
            "Szkic przygotowaliśmy z informacji zapisanych w bazie lub potwierdzonych w publicznych źródłach. Po rejestracji możesz poprawić dane i opublikować stronę."}
        </div>
      }
      bottomPrimaryAction={{ label: "Załóż konto i zarządzaj studiem", href: claimHref }}
    />
  );
}

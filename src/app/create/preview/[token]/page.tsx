import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InstructorPageContent } from "@/components/page-contents/instructor/InstructorPageContent";
import { getGeneratedInstructorProfileDraft } from "@/lib/api/getGeneratedInstructorProfileDraft";

interface PreviewPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Podgląd profilu nauczyciela jogi | joga.yoga",
  description: "Automatycznie przygotowany szkic profilu nauczyciela jogi.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GeneratedInstructorProfileDraftPreviewPage({
  params,
}: PreviewPageProps) {
  const { token } = await params;
  const draft = await getGeneratedInstructorProfileDraft(token);

  if (!draft) {
    notFound();
  }

  const claimHref = `/profile/auth/login?next=${encodeURIComponent(
    `/create/preview/${draft.public_token}`,
  )}`;

  return (
    <InstructorPageContent
      data={draft.profile}
      draftNotice={
        <div
          className="rounded-xl border px-4 py-3 text-sm leading-5"
          style={{ borderColor: "#EBEBEB", background: "#F7F7F7", color: "#717171" }}
        >
          Profil został przygotowany automatycznie na podstawie publicznych źródeł. Po założeniu
          konta będzie można sprawdzić, edytować i opublikować stronę.
        </div>
      }
      bottomPrimaryAction={{
        label: "Załóż konto i opublikuj profil",
        href: claimHref,
      }}
    />
  );
}

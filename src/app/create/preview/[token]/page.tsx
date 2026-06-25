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

  const claimHref = `/create/claim/${draft.public_token}`;

  return (
    <InstructorPageContent
      data={draft.profile}
      draftNotice={
        <div
          className="rounded-xl border px-4 py-3 text-sm italic leading-5"
          style={{ borderColor: "#EBEBEB", background: "#F7F7F7", color: "#52525B" }}
        >
          Profil utworzony automatycznie z publicznych informacji. Możesz założyć konto, poprawić
          dane i opublikować
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

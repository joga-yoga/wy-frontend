import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GeneratedInstructorProfilePreview } from "@/components/create-profile/GeneratedInstructorProfilePreview";
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

  return <GeneratedInstructorProfilePreview draft={draft} claimHref={claimHref} />;
}

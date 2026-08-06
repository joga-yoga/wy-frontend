import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GeneratedStudioProfilePreview } from "@/components/create-profile/GeneratedStudioProfilePreview";
import { getGeneratedStudioProfileDraft } from "@/lib/api/getGeneratedStudioProfileDraft";

export const metadata: Metadata = {
  title: "Szkic strony studia | joga.yoga",
  robots: { index: false, follow: false },
};

export default async function StudioDraftPreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const draft = await getGeneratedStudioProfileDraft(token);
  if (!draft) notFound();
  return <GeneratedStudioProfilePreview draft={draft} claimHref={`/studio/dodaj/claim/${token}`} />;
}

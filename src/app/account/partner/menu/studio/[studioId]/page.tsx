"use client";

import { useParams } from "next/navigation";

import { StudioWorkspaceRows } from "@/components/menu/StudioWorkspaceRows";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";

/** The 2+-studio case (spec-b2b §4): tapping a studio row in Menu lands here with
 * the same 5 workspace rows the 1-studio layout flattens directly into Menu. */
export default function StudioWorkspacePage() {
  const params = useParams<{ studioId: string }>();
  const { capabilities, isLoading } = usePartnerCapabilities();
  const studio = capabilities?.managedStudios.find((s) => s.id === params.studioId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5">
        <p className="text-sm text-gray-500">Nie znaleziono studia.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <StudioWorkspaceRows
        studioId={studio.id}
        studioName={studio.name}
        studioImageId={studio.image_id}
      />
    </div>
  );
}

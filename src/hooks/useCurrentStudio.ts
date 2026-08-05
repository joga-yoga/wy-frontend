"use client";

import { useSearchParams } from "next/navigation";

import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";

/**
 * Resolves which managed studio a studio-scoped Menu screen (Instruktorzy, Klienci)
 * is acting on: the `studioId` query param set by `StudioWorkspaceRows` for 2+-studio
 * partners, falling back to the (only) managed studio otherwise. Mirrors the
 * `studio_id` param convention `GrafikContextChips` already uses.
 */
export function useCurrentStudio() {
  const searchParams = useSearchParams();
  const { capabilities, isLoading } = usePartnerCapabilities();
  const requestedId = searchParams.get("studioId");
  const managedStudios = capabilities?.managedStudios ?? [];
  const studio =
    (requestedId && managedStudios.find((s) => s.id === requestedId)) || managedStudios[0] || null;

  return { studio, isLoading, managedStudios };
}

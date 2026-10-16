"use client";

import Link from "next/link";

import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";

import { StudioForm } from "../[studioId]/edit/StudioForm";
import { ImportEntry } from "../import/fitssey/ImportEntry";

export default function CreateStudioPage() {
  const { capabilities, isLoading } = usePartnerCapabilities();
  if (isLoading) return <p className="p-4">Ładowanie…</p>;
  if (capabilities?.businessMode === "solo")
    return (
      <div className="p-4">
        <Link href="/account/partner/menu">Przejdź do zarządzania własnymi zajęciami</Link>
      </div>
    );
  return (
    <>
      <ImportEntry />
      <StudioForm routeId="create" />
    </>
  );
}

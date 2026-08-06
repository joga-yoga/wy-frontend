import type { Metadata } from "next";
import { connection } from "next/server";

import { StudioCtaPageContent } from "@/components/studio-cta/StudioCtaPageContent";
import { getPublicStudios } from "@/lib/api/getPublicStudios";
import type { StudioPublicListItem } from "@/types/studio";

export const metadata: Metadata = {
  title: "Stwórz stronę studia jogi | joga.yoga",
  description:
    "Znajdź swoje studio albo wygeneruj szkic strony studia jogi i zacznij nim zarządzać.",
  alternates: { canonical: "/studio/dodaj" },
};

export default async function StudioCtaPage() {
  await connection();
  let studios: StudioPublicListItem[] = [];
  try {
    studios = await getPublicStudios(3);
  } catch (error) {
    console.error("Failed to load CTA studio examples:", error);
  }
  return <StudioCtaPageContent studios={studios} />;
}

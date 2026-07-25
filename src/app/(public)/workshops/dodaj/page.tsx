import type { Metadata } from "next";
import { connection } from "next/server";

import type { Event } from "@/app/(public)/retreats/types";
import { WorkshopCtaPageContent } from "@/components/event-cta/WorkshopCtaPageContent";
import { getWorkshops } from "@/lib/api/workshops";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: "Dodaj wydarzenie jogowe | joga.yoga",
    description:
      "Dodaj warsztat, kurs lub wydarzenie jogowe i przygotuj jego stronę na podstawie istniejącego linku.",
    path: "/wydarzenia/dodaj",
  }),
};

export default async function AddWorkshopPage() {
  await connection();

  const params = new URLSearchParams({
    limit: "3",
    skip: "0",
    sortBy: "published_at",
    sortOrder: "desc",
  });

  let events: Event[] = [];

  try {
    const data = await getWorkshops(params);
    events = data.items.slice(0, 3);
  } catch (error) {
    console.error("Failed to load CTA workshop examples:", error);
  }

  return <WorkshopCtaPageContent events={events} />;
}

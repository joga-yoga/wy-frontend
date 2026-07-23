import type { Metadata } from "next";
import { connection } from "next/server";

import type { Event } from "@/app/(public)/retreats/types";
import { RetreatCtaPageContent } from "@/components/retreat-cta/RetreatCtaPageContent";
import { getRetreats } from "@/lib/api/retreats";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: "Dodaj wyjazd jogowy | joga.yoga",
    description:
      "Stwórz stronę wyjazdu jogowego od zera lub przygotuj jej szkic na podstawie istniejącego linku.",
    path: "/wyjazdy/dodaj",
  }),
};

export default async function AddRetreatPage() {
  await connection();

  const params = new URLSearchParams({
    limit: "3",
    skip: "0",
    sortBy: "published_at",
    sortOrder: "desc",
  });

  let events: Event[] = [];

  try {
    const data = await getRetreats(params);
    events = data.items.slice(0, 3);
  } catch (error) {
    console.error("Failed to load CTA retreat examples:", error);
  }

  return <RetreatCtaPageContent events={events} />;
}

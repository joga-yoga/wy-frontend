import { unstable_cache } from "next/cache";

import { EventDetail } from "@/app/retreats/retreats/[slug]/types";

export async function getRetreat(id: string): Promise<EventDetail | null> {
  return unstable_cache(
    async (retreatId: string): Promise<EventDetail | null> => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/retreats/${retreatId}`);

        if (res.status === 404) {
          return null;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch retreat: ${res.statusText}`);
        }

        return res.json();
      } catch (error) {
        console.error("Error fetching retreat:", error);
        return null;
      }
    },
    ["retreat-detail", id],
    {
      revalidate: 300,
      tags: ["retreats"],
    },
  )(id);
}

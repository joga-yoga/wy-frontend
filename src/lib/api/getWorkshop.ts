import { unstable_cache } from "next/cache";

import { EventDetail as RetreatEventDetail } from "@/app/retreats/retreats/[slug]/types";

// Extend retreat EventDetail with workshop-specific fields
export interface WorkshopEventDetail extends RetreatEventDetail {
  is_online?: boolean | null;
  goals?: string[] | null;
  tags?: string[] | null;
}

export async function getWorkshop(id: string): Promise<WorkshopEventDetail | null> {
  return unstable_cache(
    async (workshopId: string): Promise<WorkshopEventDetail | null> => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/workshops/${workshopId}`);

        if (res.status === 404) {
          return null;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch workshop: ${res.statusText}`);
        }

        return res.json();
      } catch (error) {
        console.error("Error fetching workshop:", error);
        return null;
      }
    },
    ["workshop-detail", id],
    {
      revalidate: 300,
      tags: ["workshops"],
    },
  )(id);
}

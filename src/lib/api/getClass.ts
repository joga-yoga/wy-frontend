import { unstable_cache } from "next/cache";

import { EventDetail as RetreatEventDetail } from "@/app/retreats/retreats/[slug]/types";

export interface ClassEventDetail extends RetreatEventDetail {
  duration_minutes?: number | null;
  level?: string | null;
  intensity?: number | null;
  style?: string | null;
}

export async function getClass(id: string): Promise<ClassEventDetail | null> {
  return unstable_cache(
    async (classId: string): Promise<ClassEventDetail | null> => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/classes/${classId}`);

        if (res.status === 404) {
          return null;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch class: ${res.statusText}`);
        }

        return res.json();
      } catch (error) {
        console.error("Error fetching class:", error);
        return null;
      }
    },
    ["class-detail", id],
    {
      revalidate: 300,
      tags: ["classes"],
    },
  )(id);
}

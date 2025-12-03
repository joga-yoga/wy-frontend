import { EventDetail } from "@/app/retreats/retreats/[retreatId]/types";

export async function getRetreat(id: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/retreats/${id}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes (300 seconds) as requested
    });

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
}

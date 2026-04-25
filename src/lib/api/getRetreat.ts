import { EventDetail } from "@/app/retreats/retreats/[slug]/types";
import { fetchEventDetail, isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";

export async function getRetreat(id: string): Promise<EventDetail | null> {
  try {
    return await fetchEventDetail<EventDetail>("retreat", id);
  } catch (error) {
    if (isEventDetailNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

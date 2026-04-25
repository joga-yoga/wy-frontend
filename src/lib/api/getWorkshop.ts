import { EventDetail as RetreatEventDetail } from "@/app/retreats/retreats/[slug]/types";
import { fetchEventDetail, isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";

// Extend retreat EventDetail with workshop-specific fields
export interface WorkshopEventDetail extends RetreatEventDetail {
  is_online?: boolean | null;
  goals?: string[] | null;
  tags?: string[] | null;
}

export async function getWorkshop(id: string): Promise<WorkshopEventDetail | null> {
  try {
    return await fetchEventDetail<WorkshopEventDetail>("workshop", id);
  } catch (error) {
    if (isEventDetailNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

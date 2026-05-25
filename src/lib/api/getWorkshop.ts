import { EventDetail as RetreatEventDetail } from "@/app/retreats/[slug]/types";
import { fetchEventDetail } from "@/lib/api/eventDetailFetch";

// Extend retreat EventDetail with workshop-specific fields
export interface WorkshopEventDetail extends RetreatEventDetail {
  is_online?: boolean | null;
  goals?: string[] | null;
  tags?: string[] | null;
}

export async function getWorkshop(id: string): Promise<WorkshopEventDetail> {
  return fetchEventDetail<WorkshopEventDetail>("workshop", id);
}

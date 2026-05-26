import { EventDetail } from "@/app/(public)/retreats/[slug]/types";
import { fetchEventDetail } from "@/lib/api/eventDetailFetch";

export async function getRetreat(id: string): Promise<EventDetail> {
  return fetchEventDetail<EventDetail>("retreat", id);
}

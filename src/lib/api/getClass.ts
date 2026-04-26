import { EventDetail as RetreatEventDetail } from "@/app/retreats/retreats/[slug]/types";
import { fetchEventDetail } from "@/lib/api/eventDetailFetch";

export interface ClassEventDetail extends RetreatEventDetail {
  duration_minutes?: number | null;
  level?: string | null;
  intensity?: number | null;
  style?: string | null;
}

export async function getClass(id: string): Promise<ClassEventDetail> {
  return fetchEventDetail<ClassEventDetail>("class", id);
}

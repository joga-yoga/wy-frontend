import { CourseEventDetail } from "@/app/(public)/courses/[slug]/types";
import { fetchEventDetail } from "@/lib/api/eventDetailFetch";

export async function getCourse(id: string): Promise<CourseEventDetail> {
  return fetchEventDetail<CourseEventDetail>("course", id);
}

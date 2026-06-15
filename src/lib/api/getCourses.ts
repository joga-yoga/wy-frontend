import { Event } from "@/app/(public)/retreats/types";
import { getCachedEventList } from "@/lib/api/eventLists";

import { prepareSearchParams } from "../prepareSearchParams";

export async function getCourses(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const preparedSearchParams = prepareSearchParams(searchParams);
  return getCachedEventList("courses", preparedSearchParams.toString());
}

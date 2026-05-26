import { Event } from "@/app/(public)/retreats/types";
import { getCachedEventList } from "@/lib/api/eventLists";

import { prepareSearchParams } from "../prepareSearchParams";

export async function getWorkshops(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const preparedSearchParams = prepareSearchParams(searchParams);
  return getCachedEventList("workshops", preparedSearchParams.toString());
}

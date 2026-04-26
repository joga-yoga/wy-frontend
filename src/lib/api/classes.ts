import { Event } from "@/app/retreats/types";
import { getCachedEventList } from "@/lib/api/eventLists";

import { prepareSearchParams } from "../prepareSearchParams";

export async function getClasses(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const preparedSearchParams = prepareSearchParams(searchParams);
  return getCachedEventList("classes", preparedSearchParams.toString());
}

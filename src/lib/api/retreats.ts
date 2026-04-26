import { getCachedEventList } from "@/lib/api/eventLists";

import { prepareSearchParams } from "../prepareSearchParams";

export const getRetreats = (searchParams: URLSearchParams) => {
  const preparedSearchParams = prepareSearchParams(searchParams);
  return getCachedEventList("retreats", preparedSearchParams.toString());
};

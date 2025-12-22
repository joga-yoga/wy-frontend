import { Event } from "@/app/retreats/types";

import { prepareSearchParams } from "../prepareSearchParams";

export async function getRetreats(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const preparedSearchParams = prepareSearchParams(searchParams);
  const queryString = preparedSearchParams.toString();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/retreats/public?${queryString}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch retreats");
  }

  return res.json();
}

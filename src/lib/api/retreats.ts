import { cacheLife, cacheTag } from "next/cache";

import { Event } from "@/app/retreats/types";

import { prepareSearchParams } from "../prepareSearchParams";

async function getCachedRetreats(queryString: string): Promise<{ items: Event[]; total: number }> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("retreats");

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/retreats/public?${queryString}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch retreats: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const getRetreats = (searchParams: URLSearchParams) => {
  const preparedSearchParams = prepareSearchParams(searchParams);
  return getCachedRetreats(preparedSearchParams.toString());
};

import { cacheLife, cacheTag } from "next/cache";

import { Event } from "@/app/retreats/types";

import { prepareSearchParams } from "../prepareSearchParams";

async function getCachedWorkshops(queryString: string): Promise<{ items: Event[]; total: number }> {
  "use cache";

  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("workshops");

  const baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  const res = await fetch(`${baseUrl}/workshops/public?${queryString}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch workshops: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getWorkshops(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const preparedSearchParams = prepareSearchParams(searchParams);
  return getCachedWorkshops(preparedSearchParams.toString());
}

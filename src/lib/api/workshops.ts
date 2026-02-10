import { unstable_cache } from "next/cache";

import { Event } from "@/app/retreats/types";

import { prepareSearchParams } from "../prepareSearchParams";

export async function getWorkshops(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const preparedSearchParams = prepareSearchParams(searchParams);
  const queryString = preparedSearchParams.toString();

  return unstable_cache(
    async (paramsString: string): Promise<{ items: Event[]; total: number }> => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/workshops/public?${paramsString}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch workshops");
      }

      return res.json();
    },
    ["workshops-list", queryString],
    {
      revalidate: 300,
      tags: ["workshops"],
    },
  )(queryString);
}

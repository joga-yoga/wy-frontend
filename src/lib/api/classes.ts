import { unstable_cache } from "next/cache";

import { Event } from "@/app/retreats/types";

import { prepareSearchParams } from "../prepareSearchParams";

export async function getClasses(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const preparedSearchParams = prepareSearchParams(searchParams);
  const queryString = preparedSearchParams.toString();

  return unstable_cache(
    async (paramsString: string): Promise<{ items: Event[]; total: number }> => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/classes/public?${paramsString}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch classes");
      }

      return res.json();
    },
    ["classes-list", queryString],
    {
      revalidate: 300,
      tags: ["classes"],
    },
  )(queryString);
}

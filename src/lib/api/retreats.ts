import { unstable_cache } from "next/cache";

import { Event } from "@/app/retreats/types";

import { prepareSearchParams } from "../prepareSearchParams";

export const getRetreats = (searchParams: URLSearchParams) => {
  const preparedSearchParams = prepareSearchParams(searchParams);
  const queryString = preparedSearchParams.toString();

  return unstable_cache(
    async (paramsString: string): Promise<{ items: Event[]; total: number }> => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/retreats/public?${paramsString}`,
      );

      if (!res.ok) throw new Error("Failed to fetch retreats");
      return res.json();
    },
    ["retreats-list", queryString],
    {
      revalidate: 300,
      tags: ["retreats"],
    },
  )(queryString);
};

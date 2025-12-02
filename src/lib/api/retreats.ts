import { Event } from "@/app/retreats/types";

export async function getRetreats(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const queryString = searchParams.toString();
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

import { Event } from "@/app/retreats/types";

export async function getWorkshops(
  searchParams: URLSearchParams,
): Promise<{ items: Event[]; total: number }> {
  const queryString = searchParams.toString();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/workshops/public?${queryString}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch workshops");
  }

  return res.json();
}

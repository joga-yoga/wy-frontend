import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDirectoryListing } from "@/lib/api/getCityDirectory";

import { ClaimStudioForm } from "./ClaimStudioForm";

interface ClaimPageProps {
  params: Promise<{ externalId: string }>;
}

/** Noindexed: a claim funnel step is for the person who arrived from the listing, not for
 *  search. §6 is explicit that both destination pages stay out of the index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * ⚠ **Keyed by `external_id`, not by slug.**
 *
 * This page is reached from the ⋯ on a **recessed** card — a listing below the content bar,
 * which has no slug at all. The first version routed at `/studio/{slug}/przejmij`, so the
 * drawer rendered `href="/studio//przejmij"` and every claim 404'd. The claim entry exists
 * for exactly the rows that have no URL, so it cannot be keyed on one.
 */
export default async function ClaimStudioPage({ params }: ClaimPageProps) {
  const { externalId } = await params;
  const listing = await getDirectoryListing(externalId);

  if (!listing) {
    notFound();
  }

  return <ClaimStudioForm listing={listing} />;
}

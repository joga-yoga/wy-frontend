import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDirectoryListing } from "@/lib/api/getCityDirectory";

import { RemovalRequestForm } from "./RemovalRequestForm";

interface RemovalPageProps {
  params: Promise<{ externalId: string }>;
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Keyed by `external_id` for the same reason the claim page is — see that page. A removal
 *  request has to work for a listing with no page, which is most of them. */
export default async function RemovalRequestPage({ params }: RemovalPageProps) {
  const { externalId } = await params;
  const listing = await getDirectoryListing(externalId);

  if (!listing) {
    notFound();
  }

  return <RemovalRequestForm listing={listing} />;
}

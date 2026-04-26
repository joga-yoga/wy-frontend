import { Metadata } from "next";

import { TermsOfServicePageContent } from "@/components/page-contents/(info)/TermsOfServicePageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: "Regulamin | wydarzenia.yoga",
    description: "Regulamin korzystania z serwisu wydarzenia.yoga dla uczestników i organizatorów.",
    path: "/terms",
  }),
};

export default function TermsOfServiceWorkshopsPage() {
  return <TermsOfServicePageContent project="workshops" />;
}

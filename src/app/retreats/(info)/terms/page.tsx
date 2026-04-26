import { Metadata } from "next";

import { TermsOfServicePageContent } from "@/components/page-contents/(info)/TermsOfServicePageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: "Regulamin | wyjazdy.yoga",
    description: "Regulamin korzystania z serwisu wyjazdy.yoga dla uczestników i organizatorów.",
    path: "/terms",
  }),
};

export default function TermsOfServiceRetreatsPage() {
  return <TermsOfServicePageContent project="retreats" />;
}

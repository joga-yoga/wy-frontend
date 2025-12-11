import { Metadata } from "next";

import { TermsOfServicePageContent } from "@/components/page-contents/(info)/TermsOfServicePageContent";

export const metadata: Metadata = {
  title: "Regulamin | wydarzenia.yoga",
  description: "Regulamin korzystania z serwisu wydarzenia.yoga dla uczestników i organizatorów.",
  openGraph: {
    title: "Regulamin | wydarzenia.yoga",
    description: "Regulamin korzystania z serwisu wydarzenia.yoga dla uczestników i organizatorów.",
    images: ["/images/social_wydarzenia.png"],
  },
};

export default function TermsOfServiceWorkshopsPage() {
  return <TermsOfServicePageContent project="workshops" />;
}

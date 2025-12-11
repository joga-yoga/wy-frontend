import { Metadata } from "next";

import { TermsOfServicePageContent } from "@/components/page-contents/(info)/TermsOfServicePageContent";

export const metadata: Metadata = {
  title: "Regulamin | wyjazdy.yoga",
  description: "Regulamin korzystania z serwisu wyjazdy.yoga dla uczestników i organizatorów.",
  openGraph: {
    title: "Regulamin | wyjazdy.yoga",
    description: "Regulamin korzystania z serwisu wyjazdy.yoga dla uczestników i organizatorów.",
    images: ["/images/social_wyjazdy.png"],
  },
};

export default function TermsOfServiceRetreatsPage() {
  return <TermsOfServicePageContent project="retreats" />;
}

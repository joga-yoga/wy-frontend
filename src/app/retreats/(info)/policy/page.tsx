import { Metadata } from "next";

import { PrivacyPolicyPageContent } from "@/components/page-contents/(info)/PrivacyPolicyPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: "Polityka Prywatności | joga.yoga",
    description: "Zasady przetwarzania danych osobowych i polityka prywatności serwisu joga.yoga.",
    path: "/wyjazdy/policy",
  }),
};

export default function PrivacyPolicyRetreatsPage() {
  return <PrivacyPolicyPageContent project="retreats" />;
}

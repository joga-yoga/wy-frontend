import { Metadata } from "next";

import { PrivacyPolicyPageContent } from "@/components/page-contents/(info)/PrivacyPolicyPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: "Polityka Prywatności | joga.yoga",
    description: "Zasady przetwarzania danych osobowych i polityka prywatności serwisu joga.yoga.",
    path: "/policy",
  }),
};

export default function PrivacyPolicyWorkshopsPage() {
  return <PrivacyPolicyPageContent />;
}

import { Metadata } from "next";

import { PrivacyPolicyPageContent } from "@/components/page-contents/(info)/PrivacyPolicyPageContent";

export const metadata: Metadata = {
  title: "Polityka Prywatności | wydarzenia.yoga",
  description:
    "Zasady przetwarzania danych osobowych i polityka prywatności serwisu wydarzenia.yoga.",
  openGraph: {
    title: "Polityka Prywatności | wydarzenia.yoga",
    description:
      "Zasady przetwarzania danych osobowych i polityka prywatności serwisu wydarzenia.yoga.",
    images: ["/images/social_wydarzenia.png"],
  },
};

export default function PrivacyPolicyWorkshopsPage() {
  return <PrivacyPolicyPageContent project="workshops" />;
}

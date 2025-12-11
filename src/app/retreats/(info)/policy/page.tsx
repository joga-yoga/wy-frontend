import { Metadata } from "next";

import { PrivacyPolicyPageContent } from "@/components/page-contents/(info)/PrivacyPolicyPageContent";

export const metadata: Metadata = {
  title: "Polityka Prywatności | wyjazdy.yoga",
  description: "Zasady przetwarzania danych osobowych i polityka prywatności serwisu wyjazdy.yoga.",
  openGraph: {
    title: "Polityka Prywatności | wyjazdy.yoga",
    description:
      "Zasady przetwarzania danych osobowych i polityka prywatności serwisu wyjazdy.yoga.",
    images: ["/images/social_wyjazdy.png"],
  },
};

export default function PrivacyPolicyRetreatsPage() {
  return <PrivacyPolicyPageContent project="retreats" />;
}

import { Metadata } from "next";

import { FAQTravelersPageContent } from "@/components/page-contents/(info)/FAQTravelersPageContent";

export const metadata: Metadata = {
  title: "FAQ dla Uczestników | wyjazdy.yoga",
  description:
    "Odpowiedzi na pytania uczestników wyjazdów jogowych. Jak się przygotować, co zabrać i jak rezerwować.",
  openGraph: {
    title: "FAQ dla Uczestników | wyjazdy.yoga",
    description:
      "Odpowiedzi na pytania uczestników wyjazdów jogowych. Jak się przygotować, co zabrać i jak rezerwować.",
    images: ["/images/social_wyjazdy.png"],
  },
};

export default function FAQTravelersRetreatsPage() {
  return <FAQTravelersPageContent project="retreats" />;
}

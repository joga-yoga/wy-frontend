import { Metadata } from "next";

import { FAQTravelersPageContent } from "@/components/page-contents/(info)/FAQTravelersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: "FAQ dla Uczestników | joga.yoga",
    description:
      "Odpowiedzi na pytania uczestników wyjazdów jogowych. Jak się przygotować, co zabrać i jak rezerwować.",
    path: "/wyjazdy/faq/travelers",
  }),
};

export default function FAQTravelersRetreatsPage() {
  return <FAQTravelersPageContent project="retreats" />;
}

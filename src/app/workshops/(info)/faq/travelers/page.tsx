import { Metadata } from "next";

import { FAQTravelersPageContent } from "@/components/page-contents/(info)/FAQTravelersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: "FAQ dla Uczestników | wydarzenia.yoga",
    description:
      "Wszystko co musisz wiedzieć przed udziałem w warsztatach jogowych. Odpowiedzi na najczęstsze pytania.",
    path: "/faq/travelers",
  }),
};

export default function FAQTravelersWorkshopsPage() {
  return <FAQTravelersPageContent project="workshops" />;
}

import { Metadata } from "next";

import { FAQTravelersPageContent } from "@/components/page-contents/(info)/FAQTravelersPageContent";

export const metadata: Metadata = {
  title: "FAQ dla Uczestników | wydarzenia.yoga",
  description:
    "Wszystko co musisz wiedzieć przed udziałem w warsztatach jogowych. Odpowiedzi na najczęstsze pytania.",
  openGraph: {
    title: "FAQ dla Uczestników | wydarzenia.yoga",
    description:
      "Wszystko co musisz wiedzieć przed udziałem w warsztatach jogowych. Odpowiedzi na najczęstsze pytania.",
    images: ["/images/social_wydarzenia.png"],
  },
};

export default function FAQTravelersWorkshopsPage() {
  return <FAQTravelersPageContent project="workshops" />;
}

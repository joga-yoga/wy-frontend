import { Metadata } from "next";

import { PartnersPageContent } from "@/components/page-contents/(info)/partners/PartnersPageContent";

export const metadata: Metadata = {
  title: "Zostań partnerem | wydarzenia.yoga",
  description:
    "Dołącz do grona organizatorów wydarzeń jogowych. Promuj swoje warsztaty i kursy, docierając do szerokiej grupy odbiorców.",
  openGraph: {
    title: "Zostań partnerem | wydarzenia.yoga",
    description:
      "Dołącz do grona organizatorów wydarzeń jogowych. Promuj swoje warsztaty i kursy, docierając do szerokiej grupy odbiorców.",
    images: ["/images/social_wydarzenia.png"],
  },
};

export default function PartnersWorkshopsPage() {
  return <PartnersPageContent project="workshops" />;
}

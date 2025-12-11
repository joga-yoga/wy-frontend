import { Metadata } from "next";

import { PartnersPageContent } from "@/components/page-contents/(info)/partners/PartnersPageContent";

export const metadata: Metadata = {
  title: "Zostań partnerem | wyjazdy.yoga",
  description:
    "Dołącz do grona organizatorów wyjazdów jogowych. Promuj swoje wydarzenia i docieraj do tysięcy osób poszukujących harmonii i rozwoju.",
  openGraph: {
    title: "Zostań partnerem | wyjazdy.yoga",
    description:
      "Dołącz do grona organizatorów wyjazdów jogowych. Promuj swoje wydarzenia i docieraj do tysięcy osób poszukujących harmonii i rozwoju.",
    images: ["/images/social_wyjazdy.png"],
  },
};

export default function PartnersRetreatsPage() {
  return <PartnersPageContent project="retreats" />;
}

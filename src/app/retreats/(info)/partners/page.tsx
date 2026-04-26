import { Metadata } from "next";

import { PartnersPageContent } from "@/components/page-contents/(info)/partners/PartnersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: "Zostań partnerem | wyjazdy.yoga",
    description:
      "Dołącz do grona organizatorów wyjazdów jogowych. Promuj swoje wydarzenia i docieraj do tysięcy osób poszukujących harmonii i rozwoju.",
    path: "/partners",
  }),
};

export default function PartnersRetreatsPage() {
  return <PartnersPageContent project="retreats" />;
}

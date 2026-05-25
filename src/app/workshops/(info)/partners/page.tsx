import { Metadata } from "next";

import { PartnersPageContent } from "@/components/page-contents/(info)/partners/PartnersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: "Zostań partnerem | joga.yoga",
    description:
      "Dołącz do grona organizatorów wydarzeń jogowych. Promuj swoje warsztaty i kursy, docierając do szerokiej grupy odbiorców.",
    path: "/wydarzenia/partners",
  }),
};

export default function PartnersWorkshopsPage() {
  return <PartnersPageContent project="workshops" />;
}

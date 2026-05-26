import { Metadata } from "next";

import { FAQOrganizersPageContent } from "@/components/page-contents/(info)/FAQOrganizersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: "FAQ dla Organizatorów | joga.yoga",
    description:
      "Pytania i odpowiedzi dla organizatorów warsztatów. Sprawdź jak promować swoje wydarzenia jogowe.",
    path: "/wydarzenia/faq/organizers",
  }),
};

export default function FAQOrganizersWorkshopsPage() {
  return <FAQOrganizersPageContent project="workshops" />;
}

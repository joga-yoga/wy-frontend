import { Metadata } from "next";

import { FAQOrganizersPageContent } from "@/components/page-contents/(info)/FAQOrganizersPageContent";

export const metadata: Metadata = {
  title: "FAQ dla Organizatorów | wydarzenia.yoga",
  description:
    "Pytania i odpowiedzi dla organizatorów warsztatów. Sprawdź jak promować swoje wydarzenia jogowe.",
  openGraph: {
    title: "FAQ dla Organizatorów | wydarzenia.yoga",
    description:
      "Pytania i odpowiedzi dla organizatorów warsztatów. Sprawdź jak promować swoje wydarzenia jogowe.",
    images: ["/images/social_wydarzenia.png"],
  },
};

export default function FAQOrganizersWorkshopsPage() {
  return <FAQOrganizersPageContent project="workshops" />;
}

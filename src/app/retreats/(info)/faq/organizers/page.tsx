import { Metadata } from "next";

import { FAQOrganizersPageContent } from "@/components/page-contents/(info)/FAQOrganizersPageContent";

export const metadata: Metadata = {
  title: "FAQ dla Organizatorów | wyjazdy.yoga",
  description:
    "Najczęściej zadawane pytania przez organizatorów wyjazdów. Dowiedz się jak dodać ofertę i dotrzeć do uczestników.",
  openGraph: {
    title: "FAQ dla Organizatorów | wyjazdy.yoga",
    description:
      "Najczęściej zadawane pytania przez organizatorów wyjazdów. Dowiedz się jak dodać ofertę i dotrzeć do uczestników.",
    images: ["/images/social_wyjazdy.png"],
  },
};

export default function FAQOrganizersRetreatsPage() {
  return <FAQOrganizersPageContent project="retreats" />;
}

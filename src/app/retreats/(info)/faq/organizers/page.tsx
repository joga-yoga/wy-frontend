import { Metadata } from "next";

import { FAQOrganizersPageContent } from "@/components/page-contents/(info)/FAQOrganizersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: "FAQ dla Organizatorów | wyjazdy.yoga",
    description:
      "Najczęściej zadawane pytania przez organizatorów wyjazdów. Dowiedz się jak dodać ofertę i dotrzeć do uczestników.",
    path: "/faq/organizers",
  }),
};

export default function FAQOrganizersRetreatsPage() {
  return <FAQOrganizersPageContent project="retreats" />;
}

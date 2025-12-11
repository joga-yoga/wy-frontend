import { Metadata } from "next";

import { ContactPageContent } from "@/components/page-contents/(info)/ContactPageContent";

export const metadata: Metadata = {
  title: "Kontakt | wyjazdy.yoga",
  description:
    "Skontaktuj się z zespołem wyjazdy.yoga. Masz pytania dotyczące platformy lub wyjazdów? Napisz do nas.",
  openGraph: {
    title: "Kontakt | wyjazdy.yoga",
    description:
      "Skontaktuj się z zespołem wyjazdy.yoga. Masz pytania dotyczące platformy lub wyjazdów? Napisz do nas.",
    images: ["/images/social_wyjazdy.png"],
  },
};

export default ContactPageContent;

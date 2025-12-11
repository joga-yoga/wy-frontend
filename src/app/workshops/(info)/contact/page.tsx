import { Metadata } from "next";

import { ContactPageContent } from "@/components/page-contents/(info)/ContactPageContent";

export const metadata: Metadata = {
  title: "Kontakt | wydarzenia.yoga",
  description:
    "Skontaktuj się z zespołem wydarzenia.yoga. Masz pytania dotyczące warsztatów lub kursów? Napisz do nas.",
  openGraph: {
    title: "Kontakt | wydarzenia.yoga",
    description:
      "Skontaktuj się z zespołem wydarzenia.yoga. Masz pytania dotyczące warsztatów lub kursów? Napisz do nas.",
    images: ["/images/social_wydarzenia.png"],
  },
};

export default ContactPageContent;

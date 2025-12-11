import { Metadata } from "next";

import { DeleteAccountPageContent } from "@/components/page-contents/(info)/DeleteAccountPageContent";

export const metadata: Metadata = {
  title: "Usuwanie konta | wydarzenia.yoga",
  description: "Procedura usuwania konta i danych osobowych z serwisu wydarzenia.yoga.",
  openGraph: {
    title: "Usuwanie konta | wydarzenia.yoga",
    description: "Procedura usuwania konta i danych osobowych z serwisu wydarzenia.yoga.",
    images: ["/images/social_wydarzenia.png"],
  },
};

export default DeleteAccountPageContent;

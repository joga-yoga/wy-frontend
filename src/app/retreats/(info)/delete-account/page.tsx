import { Metadata } from "next";

import { DeleteAccountPageContent } from "@/components/page-contents/(info)/DeleteAccountPageContent";

export const metadata: Metadata = {
  title: "Usuwanie konta | wyjazdy.yoga",
  description: "Procedura usuwania konta i danych osobowych z serwisu wyjazdy.yoga.",
  openGraph: {
    title: "Usuwanie konta | wyjazdy.yoga",
    description: "Procedura usuwania konta i danych osobowych z serwisu wyjazdy.yoga.",
    images: ["/images/social_wyjazdy.png"],
  },
};

export default DeleteAccountPageContent;

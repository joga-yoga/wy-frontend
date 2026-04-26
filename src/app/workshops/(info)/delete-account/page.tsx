import { Metadata } from "next";

import { DeleteAccountPageContent } from "@/components/page-contents/(info)/DeleteAccountPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: "Usuwanie konta | wydarzenia.yoga",
    description: "Procedura usuwania konta i danych osobowych z serwisu wydarzenia.yoga.",
    path: "/delete-account",
  }),
};

export default DeleteAccountPageContent;

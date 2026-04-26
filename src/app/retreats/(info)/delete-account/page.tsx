import { Metadata } from "next";

import { DeleteAccountPageContent } from "@/components/page-contents/(info)/DeleteAccountPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: "Usuwanie konta | wyjazdy.yoga",
    description: "Procedura usuwania konta i danych osobowych z serwisu wyjazdy.yoga.",
    path: "/delete-account",
  }),
};

export default DeleteAccountPageContent;

import { Metadata } from "next";

import { DeleteAccountPageContent } from "@/components/page-contents/(info)/DeleteAccountPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "retreats",
    title: "Usuwanie konta | joga.yoga",
    description: "Procedura usuwania konta i danych osobowych z serwisu joga.yoga.",
    path: "/wyjazdy/delete-account",
  }),
};

export default DeleteAccountPageContent;

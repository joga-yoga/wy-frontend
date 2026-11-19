import type { Metadata } from "next";
import { connection } from "next/server";

import { PartnersPageContent } from "@/components/page-contents/(info)/partners/PartnersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  project: "workshops",
  title: "Pokaż swoją jogę | joga.yoga",
  description:
    "Stwórz stronę nauczyciela lub studia jogi, pokaż wydarzenia, kursy i wyjazdy. Prowadź grafik zajęć i przyjmuj zapisy na joga.yoga.",
  path: "/",
});

export default async function HomePage() {
  await connection();
  return <PartnersPageContent />;
}

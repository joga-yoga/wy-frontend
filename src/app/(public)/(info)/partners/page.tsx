import { Metadata } from "next";
import { connection } from "next/server";

import { PartnersPageContent } from "@/components/page-contents/(info)/partners/PartnersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: "Zostań partnerem | joga.yoga",
    description:
      "Dodaj ogłoszenie jogowe, profil instruktora, wydarzenie, kurs lub wyjazd i zwiększ swoją widoczność na joga.yoga.",
    path: "/partners",
  }),
};

export default async function PartnersPage() {
  await connection();

  return <PartnersPageContent />;
}

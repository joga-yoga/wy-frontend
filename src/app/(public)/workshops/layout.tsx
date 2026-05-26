import { Metadata } from "next";

import { PROJECT_SEO } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(PROJECT_SEO.baseUrl),
  title: {
    default: "Wydarzenia jogowe | joga.yoga",
    template: "%s",
  },
  description: "Aktualne warsztaty, kursy, zajęcia jogi i profile organizatorów.",
  openGraph: {
    siteName: PROJECT_SEO.siteName,
    description: "Aktualne warsztaty, kursy, zajęcia jogi i profile organizatorów.",
  },
};

export default function WorkshopsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

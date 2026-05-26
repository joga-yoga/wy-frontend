import { Metadata } from "next";

import { PROJECT_SEO } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(PROJECT_SEO.baseUrl),
  title: {
    default: "Zajęcia jogi | joga.yoga",
    template: "%s",
  },
  description: "Aktualne zajęcia jogi w studiach i szkołach jogi.",
  openGraph: {
    siteName: PROJECT_SEO.siteName,
    description: "Aktualne zajęcia jogi w studiach i szkołach jogi.",
  },
};

export default function ClassesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

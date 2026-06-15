import { Metadata } from "next";

import { PROJECT_SEO } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(PROJECT_SEO.baseUrl),
  title: {
    default: "Kursy jogi | joga.yoga",
    template: "%s",
  },
  description:
    "Kursy i szkolenia nauczycielskie jogi. Certyfikowane programy RYT-200, RYT-500 i inne.",
  openGraph: {
    siteName: PROJECT_SEO.siteName,
    description:
      "Kursy i szkolenia nauczycielskie jogi. Certyfikowane programy RYT-200, RYT-500 i inne.",
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

import { BlogProblem } from "../../blog-problem";

export const metadata: Metadata = {
  title: "Blog — artykuł niedostępny | joga.yoga",
  robots: { index: false, follow: true },
};

// Internal rewrite targets for pre-stream HTTP statuses. Not linked or in the sitemap.
export default async function BlogProblemPage({ params }: { params: Promise<{ kind: string }> }) {
  return <BlogProblem missing={(await params).kind === "missing"} />;
}

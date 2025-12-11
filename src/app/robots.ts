import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // Determine sitemap and rules based on host
  // Note: In production, host will likely be wyjazdy.yoga, wydarzenia.yoga, or app.joga.yoga

  if (host.includes("wydarzenia")) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: "https://wydarzenia.yoga/sitemap.xml",
    };
  }

  if (host.includes("app")) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: "/private/",
      },
    };
  }

  // Default to wyjazdy (retreats)
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://wyjazdy.yoga/sitemap.xml",
  };
}

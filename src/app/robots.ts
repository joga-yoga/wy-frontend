import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The whole account area is private.
      disallow: ["/account/"],
    },
    sitemap: "https://joga.yoga/sitemap.xml",
  };
}

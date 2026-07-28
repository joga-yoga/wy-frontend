import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The whole account area is private — both the Polish-facing URLs and the
      // internal English route folders they rewrite to.
      disallow: ["/konto/", "/account/"],
    },
    sitemap: "https://joga.yoga/sitemap.xml",
  };
}

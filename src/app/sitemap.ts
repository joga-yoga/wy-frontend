import { MetadataRoute } from "next";
import { connection } from "next/server";

const BASE_URL = "https://joga.yoga";
const API_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const staticRoutes = ["/", "/partners", "/contact", "/policy", "/terms"].map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1 : 0.7,
  }));

  const staticWorkshopRoutes = ["/wydarzenia/faq/travelers", "/wydarzenia/faq/organizers"].map(
    (route) => ({
      url: `${BASE_URL}${route}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  );

  const staticRetreatRoutes = ["/wyjazdy", "/wyjazdy/faq/travelers", "/wyjazdy/faq/organizers"].map(
    (route) => ({
      url: `${BASE_URL}${route}`,
      changeFrequency: "monthly" as const,
      priority: route === "/wyjazdy" ? 0.9 : 0.7,
    }),
  );

  let workshopRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/workshops/slugs`);
    if (res.ok) {
      const slugs: string[] = await res.json();
      workshopRoutes = slugs.map((slug) => ({
        url: `${BASE_URL}/wydarzenia/${slug}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch workshop slugs for sitemap", error);
  }

  let retreatRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/retreats/slugs`);
    if (res.ok) {
      const slugs: string[] = await res.json();
      retreatRoutes = slugs.map((slug) => ({
        url: `${BASE_URL}/wyjazdy/${slug}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch retreat slugs for sitemap", error);
  }

  let instructorRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/instructors/slugs`);
    if (res.ok) {
      const slugs: string[] = await res.json();
      instructorRoutes = slugs.map((slug) => ({
        url: `${BASE_URL}/instruktor/${slug}`,
        // lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch instructor slugs for sitemap", error);
  }

  return [
    ...staticRoutes,
    ...staticWorkshopRoutes,
    ...staticRetreatRoutes,
    ...workshopRoutes,
    ...retreatRoutes,
    ...instructorRoutes,
  ];
}

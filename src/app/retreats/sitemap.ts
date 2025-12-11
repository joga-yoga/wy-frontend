import { MetadataRoute } from "next";

const BASE_URL = "https://wyjazdy.yoga";
const API_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    "",
    "/contact",
    "/faq/travelers",
    "/faq/organizers",
    "/policy",
    "/terms",
    "/partners",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Fetch retreat IDs
  let retreatRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/retreats/slugs`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const slugs: string[] = await res.json();
      retreatRoutes = slugs.map((slug) => ({
        url: `${BASE_URL}/retreats/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch retreat IDs for sitemap", error);
  }

  // Fetch organizer IDs
  let organizerRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/organizer/ids`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const ids: string[] = await res.json();
      organizerRoutes = ids.map((id) => ({
        url: `${BASE_URL}/organizer/${id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch organizer IDs for sitemap", error);
  }

  return [...staticRoutes, ...retreatRoutes, ...organizerRoutes];
}

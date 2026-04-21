import { MetadataRoute } from "next";

const BASE_URL = "https://wydarzenia.yoga";
const API_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Main routes
  const mainPages = [""].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  // Static routes
  const staticRoutes = [
    "/contact",
    "/faq/travelers",
    "/faq/organizers",
    "/policy",
    "/terms",
    "/partners",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    // lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Fetch workshop Slugs
  let workshopRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/workshops/slugs`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const slugs: string[] = await res.json();
      workshopRoutes = slugs.map((slug) => ({
        url: `${BASE_URL}/workshops/${slug}`,
        // lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch workshop Slugs for sitemap", error);
  }

  // // Fetch organizer IDs
  // let organizerRoutes: MetadataRoute.Sitemap = [];
  // try {
  //   const res = await fetch(`${API_URL}/partner/ids`, { next: { revalidate: 3600 } });
  //   if (res.ok) {
  //     const ids: string[] = await res.json();
  //     organizerRoutes = ids.map((id) => ({
  //       url: `${BASE_URL}/partner/${id}`,
  //       lastModified: new Date(),
  //       changeFrequency: "weekly" as const,
  //       priority: 0.7,
  //     }));
  //   }
  // } catch (error) {
  //   console.error("Failed to fetch organizer IDs for sitemap", error);
  // }

  return [...mainPages, ...staticRoutes, ...workshopRoutes];
}

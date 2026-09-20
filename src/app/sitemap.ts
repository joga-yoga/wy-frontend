import { MetadataRoute } from "next";
import { connection } from "next/server";

const BASE_URL = "https://joga.yoga";
const API_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

export const revalidate = 3600;

// ⚠ TEMPORARILY HIDDEN (2026-09-15). The studio directory — `/studia`, the city pages and the
// unclaimed `/studio/{slug}` listings — is deployed, but kept out of the sitemap until its
// descriptions are rewritten. Managed studios stay in.
//
// To restore, undo the three blocks marked ⚠ TEMPORARILY HIDDEN in this file:
//   1. uncomment "/studia" in `staticRoutes`
//   2. uncomment the `cityRoutes` fetch
//   3. drop the `/directory/slugs` subtraction from `studioRoutes`
//
// ⚠ Leaving URLs out of the sitemap only stops *announcing* them. It does not stop Google from
// indexing a page it reaches by a link. Nothing outside the directory links into it today.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const staticRoutes = [
    "/",
    "/partners",
    "/contact",
    "/policy",
    "/terms",
    // The instructor directory. Every card on it links to a claimed profile, and
    // `/instructors/slugs` below lists exactly the same set — both go through
    // `publicly_listable` on the backend — so no entry here points at a noindex page.
    "/instruktorzy",
    "/instruktor/dodaj",
    "/studio/dodaj",
    "/system-dla-studiow-jogi",
    "/cennik",
    // ⚠ TEMPORARILY HIDDEN — see `DIRECTORY_HIDDEN_FROM_SITEMAP` below.
    // The studio directory index. Every city it links to is in `cityRoutes` below and every
    // studio it links to is in `studioRoutes`, so nothing here reaches an unlisted page.
    // "/studia",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1 : 0.7,
  }));

  const staticWorkshopRoutes = [
    "/wydarzenia/dodaj",
    "/wydarzenia/faq/travelers",
    "/wydarzenia/faq/organizers",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const staticRetreatRoutes = [
    "/wyjazdy",
    "/wyjazdy/dodaj",
    "/wyjazdy/faq/travelers",
    "/wyjazdy/faq/organizers",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: "monthly" as const,
    priority: route === "/wyjazdy" ? 0.9 : 0.7,
  }));

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

  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/courses/slugs`);
    if (res.ok) {
      const slugs: string[] = await res.json();
      courseRoutes = slugs.map((slug) => ({
        url: `${BASE_URL}/kursy/${slug}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch course slugs for sitemap", error);
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

  // The city hubs. `GET /directory/cities` returns exactly the cities with a page — the same
  // table `/[miasto]` resolves against — so a city here can never be a soft 404, and a city
  // page that exists can never be missing from here.
  // ⚠ TEMPORARILY HIDDEN — see the note above `sitemap()`.
  const cityRoutes: MetadataRoute.Sitemap = [];
  // try {
  //   const res = await fetch(`${API_URL}/directory/cities`);
  //   if (res.ok) {
  //     const cities: { slug: string }[] = await res.json();
  //     cityRoutes = cities.map((city) => ({
  //       url: `${BASE_URL}/${city.slug}`,
  //       changeFrequency: "weekly" as const,
  //       priority: 0.8,
  //     }));
  //   }
  // } catch (error) {
  //   console.error("Failed to fetch directory cities for sitemap", error);
  // }

  // Managed studios **and** unclaimed directory listings, from one predicate on the backend —
  // the same one `/studio/[slug]` reads for its `noIndex` and its structured data.
  //
  // ⚠ TEMPORARILY HIDDEN — see the note above `sitemap()`. `/public/studios/slugs` returns both
  // kinds of studio, so the directory's own slugs are subtracted to keep only managed studios.
  // If the directory list cannot be fetched, **no** studio is listed: failing open would put
  // every hidden listing into the sitemap at once.
  let studioRoutes: MetadataRoute.Sitemap = [];
  try {
    const [res, directoryRes] = await Promise.all([
      fetch(`${API_URL}/public/studios/slugs`),
      fetch(`${API_URL}/directory/slugs`),
    ]);
    if (res.ok && directoryRes.ok) {
      const directorySlugs = new Set<string>(await directoryRes.json());
      const slugs: string[] = (await res.json()).filter(
        (slug: string) => !directorySlugs.has(slug),
      );
      studioRoutes = slugs.map((slug) => ({
        url: `${BASE_URL}/studio/${slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch studio slugs for sitemap", error);
  }

  return [
    ...staticRoutes,
    ...staticWorkshopRoutes,
    ...staticRetreatRoutes,
    ...workshopRoutes,
    ...retreatRoutes,
    ...courseRoutes,
    ...instructorRoutes,
    ...cityRoutes,
    ...studioRoutes,
  ];
}

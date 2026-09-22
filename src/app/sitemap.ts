import { MetadataRoute } from "next";
import { connection } from "next/server";

import { cityStudiosPath, cityStylePath, styleHubPath } from "@/lib/directoryPaths";
import { getStyleCopy } from "@/lib/yogaStyleCopy";

const BASE_URL = "https://joga.yoga";
const API_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

export const revalidate = 3600;

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
    // The studio directory index. Every city it links to is in `cityRoutes` below and every
    // studio it links to is in `studioRoutes`, so nothing here reaches an unlisted page.
    "/studia",
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

  // The city directories — `/krakow/studia`. `GET /directory/cities` returns exactly the cities
  // with a page — the same list `src/proxy.ts` resolves against — so a city here can never be a
  // soft 404, and a city page that exists can never be missing from here. The bare `/krakow` is
  // deliberately absent: it is a 302 until the city hub exists.
  let cityRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/directory/cities`);
    if (res.ok) {
      const cities: { slug: string }[] = await res.json();
      cityRoutes = cities.map((city) => ({
        url: `${BASE_URL}${cityStudiosPath(city.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch directory cities for sitemap", error);
  }

  // Managed studios **and** unclaimed directory listings, from one predicate on the backend —
  // the same one `/studio/[slug]` reads for its `noIndex` and its structured data.
  let studioRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/public/studios/slugs`);
    if (res.ok) {
      const slugs: string[] = await res.json();
      studioRoutes = slugs.map((slug) => ({
        url: `${BASE_URL}/studio/${slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch studio slugs for sitemap", error);
  }

  // Style pages — the national hubs (`/studia/hatha`) and city style pages
  // (`/krakow/studia/hatha`).
  // `GET /directory/style-pages` reads the same gate as the pages and the city page's links
  // (`services/style_pages.py`), so nothing listed here can 404 on the backend's account. The
  // copy filter covers the frontend's: a style with no text in `yogaStyleCopy.ts` renders a 404
  // rather than a bare list, so it must not be announced either.
  let styleRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/directory/style-pages`);
    if (res.ok) {
      const pages: { city_slug: string | null; style_slug: string }[] = await res.json();
      styleRoutes = pages
        .filter((page) => getStyleCopy(page.style_slug))
        .map((page) => ({
          url: `${BASE_URL}${
            page.city_slug
              ? cityStylePath(page.city_slug, page.style_slug)
              : styleHubPath(page.style_slug)
          }`,
          changeFrequency: "weekly" as const,
          priority: page.city_slug ? 0.7 : 0.8,
        }));
    }
  } catch (error) {
    console.error("Failed to fetch style pages for sitemap", error);
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
    ...styleRoutes,
    ...studioRoutes,
  ];
}

import type { Metadata, MetadataRoute } from "next";

import { buildPageMetadata, PROJECT_SEO } from "@/lib/seo";

import type { ArticleDetail, ArticleList } from "./types";

export const blogPath = (slug?: string) => (slug ? `/blog/${encodeURIComponent(slug)}` : "/blog");
export const blogUrl = (slug?: string) => `${PROJECT_SEO.baseUrl}${blogPath(slug)}`;

export function blogMetadata(article?: ArticleDetail): Metadata {
  const title = article
    ? `${article.seo_metadata.title || article.title} | joga.yoga`
    : "Blog o jodze i praktyce | joga.yoga";
  const description =
    article?.seo_metadata.description ||
    article?.description ||
    "Artykuły o jodze, codziennej praktyce i odpoczynku. Czytaj na joga.yoga.";
  const robots = article?.seo_metadata.robots?.toLowerCase().split(/[\s,]+/) ?? [];
  const metadata = buildPageMetadata({
    project: "workshops",
    title,
    description,
    path: blogPath(article?.slug),
    noIndex: robots.includes("noindex") || robots.includes("none"),
  });
  return {
    ...metadata,
    // No article media is exposed by the contract. Do not assign a workshop image.
    openGraph: {
      ...metadata.openGraph,
      type: article ? "article" : "website",
      images: [],
      ...(article
        ? {
            authors: article.author ? [article.author.name] : undefined,
            publishedTime: article.published_at ?? undefined,
            modifiedTime: article.updated_at,
          }
        : {}),
    },
    twitter: { card: "summary", title, description, images: [] },
    authors: article?.author ? [{ name: article.author.name }] : undefined,
    robots: {
      index: !robots.includes("noindex") && !robots.includes("none"),
      follow: !robots.includes("nofollow") && !robots.includes("none"),
    },
  };
}

export function articleJsonLd(article: ArticleDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.seo_metadata.description,
    url: blogUrl(article.slug),
    mainEntityOfPage: blogUrl(article.slug),
    ...(article.author ? { author: { "@type": "Person", name: article.author.name } } : {}),
    ...(article.published_at ? { datePublished: article.published_at } : {}),
    dateModified: article.updated_at,
  };
}

export function articleSitemapEntries(list: ArticleList): MetadataRoute.Sitemap {
  return list.items.map((article) => ({
    url: blogUrl(article.slug),
    lastModified: article.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
}

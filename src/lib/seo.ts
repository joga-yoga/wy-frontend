import type { Metadata } from "next";

import type { EventDetail } from "@/app/retreats/retreats/[slug]/types";
import type { OrganizerInfo } from "@/components/page-contents/organizer/types";

export type SeoProject = "retreats" | "workshops";

type ProjectSeoConfig = {
  siteName: string;
  baseUrl: string;
  defaultImage: string;
};

export const PROJECT_SEO: Record<SeoProject, ProjectSeoConfig> = {
  retreats: {
    siteName: "wyjazdy.yoga",
    baseUrl: "https://wyjazdy.yoga",
    defaultImage: "/images/social_wyjazdy.png",
  },
  workshops: {
    siteName: "wydarzenia.yoga",
    baseUrl: "https://wydarzenia.yoga",
    defaultImage: "/images/social_wydarzenia.png",
  },
};

export function absoluteUrl(project: SeoProject, path: string) {
  return new URL(path, PROJECT_SEO[project].baseUrl).toString();
}

export function buildPageMetadata({
  project,
  title,
  description,
  path,
  image,
  noIndex = false,
}: {
  project: SeoProject;
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(project, path);
  const images = [image || PROJECT_SEO[project].defaultImage];

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        pl: canonical,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: PROJECT_SEO[project].siteName,
      locale: "pl_PL",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    robots: {
      index: !noIndex,
      follow: true,
    },
  };
}

function compactRecord<T extends Record<string, unknown>>(record: T) {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    ),
  );
}

function stripHtml(value: string | null | undefined) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildEventJsonLd({
  project,
  path,
  event,
  imageUrl,
}: {
  project: SeoProject;
  path: string;
  event: EventDetail;
  imageUrl?: string;
}) {
  const location = event.location
    ? compactRecord({
        "@type": "Place",
        name: event.location.title || event.location.city || event.location.country,
        address: compactRecord({
          "@type": "PostalAddress",
          streetAddress: [event.location.address_line1, event.location.address_line2]
            .filter(Boolean)
            .join(", "),
          addressLocality: event.location.city,
          addressRegion: event.location.state_province,
          postalCode: event.location.postal_code,
          addressCountry: event.location.country,
        }),
      })
    : undefined;

  return compactRecord({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: stripHtml(event.description),
    image: imageUrl ? [imageUrl] : undefined,
    startDate: event.start_date,
    endDate: event.end_date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: absoluteUrl(project, path),
    location,
    organizer: event.organizer
      ? compactRecord({
          "@type": "Organization",
          name: event.organizer.name,
          url: absoluteUrl(project, `/partner/${event.organizer.id}`),
        })
      : undefined,
    offers:
      event.price !== null
        ? compactRecord({
            "@type": "Offer",
            price: event.price,
            priceCurrency: event.currency,
            availability: "https://schema.org/InStock",
            url: absoluteUrl(project, path),
          })
        : undefined,
  });
}

export function buildOrganizerJsonLd({
  project,
  path,
  organizer,
  imageUrl,
}: {
  project: SeoProject;
  path: string;
  organizer: OrganizerInfo;
  imageUrl?: string;
}) {
  return compactRecord({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organizer.name,
    description: stripHtml(organizer.description),
    image: imageUrl,
    url: absoluteUrl(project, path),
    email: organizer.email,
    telephone: organizer.phone_number,
  });
}

export function buildCollectionJsonLd({
  project,
  path,
  name,
  description,
}: {
  project: SeoProject;
  path: string;
  name: string;
  description: string;
}) {
  const url = absoluteUrl(project, path);

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: PROJECT_SEO[project].siteName,
      url: PROJECT_SEO[project].baseUrl,
      inLanguage: "pl-PL",
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name,
      description,
      url,
      inLanguage: "pl-PL",
      isPartOf: {
        "@type": "WebSite",
        name: PROJECT_SEO[project].siteName,
        url: PROJECT_SEO[project].baseUrl,
      },
    },
  ];
}

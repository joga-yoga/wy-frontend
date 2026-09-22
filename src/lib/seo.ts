import type { Metadata } from "next";

import type { EventDetail } from "@/app/(public)/retreats/[slug]/types";
import { joinPolish } from "@/lib/joinPolish";
import type { InstructorPublic } from "@/types/instructor";
import type { StudioDirectoryItem, StudioPublic } from "@/types/studio";

export type SeoProject = "retreats" | "workshops";

type ProjectSeoConfig = {
  siteName: string;
  baseUrl: string;
  defaultImage: string;
};

export const PROJECT_SEO: ProjectSeoConfig = {
  siteName: "joga.yoga",
  baseUrl: "https://joga.yoga",
  defaultImage: "/images/social_wydarzenia.png",
};

export function absoluteUrl(project: SeoProject, path: string) {
  return new URL(path, PROJECT_SEO.baseUrl).toString();
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
  const images = [image || PROJECT_SEO.defaultImage];

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
      siteName: PROJECT_SEO.siteName,
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

export function buildInstructorJsonLd({
  path,
  instructor,
  imageUrl,
}: {
  path: string;
  instructor: InstructorPublic;
  imageUrl?: string;
}) {
  return compactRecord({
    "@context": "https://schema.org",
    "@type": "Person",
    name: instructor.name,
    description: stripHtml(instructor.short_bio ?? instructor.description),
    image: imageUrl,
    url: absoluteUrl("workshops", path),
    knowsAbout: instructor.yoga_styles
      .map((ys) => ys.yoga_style?.name ?? ys.custom_name)
      .filter(Boolean),
  });
}

/** Roughly what Google shows of a meta description before it cuts it off itself. */
export const META_DESCRIPTION_LIMIT = 155;

/**
 * A description that fits in a search result.
 *
 * Prefers ending on a full sentence when one ends past the halfway mark — a snippet that stops
 * on a full stop reads as written, one that stops mid-word reads as truncated. Otherwise cuts on
 * the last word boundary and marks the cut with `…`.
 */
export function truncateDescription(text: string, limit = META_DESCRIPTION_LIMIT): string {
  const clean = stripHtml(text) ?? "";
  if (clean.length <= limit) return clean;

  const head = clean.slice(0, limit);
  const sentenceEnd = Math.max(
    head.lastIndexOf(". "),
    head.lastIndexOf("! "),
    head.lastIndexOf("? "),
  );
  if (sentenceEnd >= limit / 2) return head.slice(0, sentenceEnd + 1);

  const wordEnd = clean.slice(0, limit - 1).lastIndexOf(" ");
  const cut = wordEnd > 0 ? clean.slice(0, wordEnd) : clean.slice(0, limit - 1);
  return `${cut.replace(/[\s,;:–-]+$/, "")}…`;
}

/**
 * A studio page's `<title>` — `{name} – studio jogi, {city} | joga.yoga`.
 *
 * Shaped like the query that should find it: somebody searches "joga" or "studio jogi" and a
 * place far more often than a studio's name alone. Platform voice even on a managed studio's
 * page — metadata is not the owner speaking. The name leads, so if Google truncates, it
 * truncates the part the reader needs least.
 *
 * Whatever the name already says is not said again: "Lido Movement Studio - Yoga, Pilates
 * Łódź" needs neither "studio jogi" nor "Łódź" after it.
 */
export function studioPageTitle(name: string, city: string | null | undefined): string {
  const lower = name.toLocaleLowerCase("pl");
  const qualifiers = [
    /jog|yog/.test(lower) ? null : "studio jogi",
    city && !lower.includes(city.toLocaleLowerCase("pl")) ? city : null,
  ].filter(Boolean);
  const head = qualifiers.length > 0 ? `${name} – ${qualifiers.join(", ")}` : name;
  return `${head} | ${PROJECT_SEO.siteName}`;
}

/**
 * A studio page's meta description.
 *
 * The studio's own description when it has one, fitted to a search snippet. Without one, a line
 * built from facts rather than a generic sentence — "Hatha, Yin i Vinyasa · Kraków, ul. …" is
 * something a reader can act on, "Profil studia jogi" is not.
 */
export function studioMetaDescription({
  description,
  styles,
  city,
  address,
}: {
  description: string | null | undefined;
  styles: string[];
  city: string | null | undefined;
  address: string | null | undefined;
}): string {
  const own = stripHtml(description);
  if (own) return truncateDescription(own);

  const what = styles.length > 0 ? joinPolish(styles.slice(0, 4)) : "Studio jogi";
  const alreadyNamesCity = Boolean(city && address?.includes(city));
  const where = [alreadyNamesCity ? null : city, address].filter(Boolean).join(", ");
  return truncateDescription(where ? `${what} · ${where}` : what);
}

function postalAddress(street: string | null | undefined, city: string | null | undefined) {
  if (!street && !city) return undefined;
  return compactRecord({
    "@type": "PostalAddress",
    streetAddress: street ?? undefined,
    addressLocality: city ?? undefined,
    addressCountry: "PL",
  });
}

function geoCoordinates(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (latitude == null || longitude == null) return undefined;
  return { "@type": "GeoCoordinates", latitude, longitude };
}

export function buildStudioJsonLd({
  path,
  studio,
  imageUrl,
}: {
  path: string;
  studio: StudioPublic;
  imageUrl?: string;
}) {
  const sameAs = studio.social_links.map((link) => link.url).filter(Boolean);
  return compactRecord({
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: studio.name,
    description: stripHtml(studio.description),
    image: imageUrl,
    url: absoluteUrl("workshops", path),
    address: postalAddress(studio.address ?? studio.location?.address_line1, studio.location?.city),
    geo: geoCoordinates(studio.location?.latitude, studio.location?.longitude),
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  });
}

/**
 * Structured data for an **unclaimed** directory studio.
 *
 * Deliberately narrower than `buildStudioJsonLd`: no image. The directory's source carries
 * none — `image_references` is an empty table — and nothing scraped about a third party
 * should become this platform's own structured data. `telephone` and `url` are facts the
 * business publishes itself.
 */
export function buildDirectoryStudioJsonLd({
  path,
  listing,
}: {
  path: string;
  listing: StudioDirectoryItem;
}) {
  return compactRecord({
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: listing.name,
    description: stripHtml(listing.description ?? undefined),
    url: absoluteUrl("workshops", path),
    address: postalAddress(listing.address, listing.city),
    geo: geoCoordinates(listing.latitude, listing.longitude),
    telephone: listing.phone ?? undefined,
    sameAs: listing.website ? [listing.website] : undefined,
  });
}

/** A city hub — `/[miasto]`. */
export function buildCityDirectoryJsonLd({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl("workshops", path),
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[],
  project: SeoProject = "workshops",
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(project, item.path),
    })),
  };
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
      name: PROJECT_SEO.siteName,
      url: PROJECT_SEO.baseUrl,
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
        name: PROJECT_SEO.siteName,
        url: PROJECT_SEO.baseUrl,
      },
    },
  ];
}

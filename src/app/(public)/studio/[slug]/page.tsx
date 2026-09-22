import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

import { SimilarStudios } from "@/components/directory/SimilarStudios";
import { StudioPageContent } from "@/components/page-contents/studio/StudioPageContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDirectoryStudio } from "@/lib/api/getCityDirectory";
import { getStudio } from "@/lib/api/getStudio";
import { getStudioSchedulePreview } from "@/lib/api/getStudioSchedulePreview";
import { cityStudiosPath } from "@/lib/directoryPaths";
import { getOgImageUrl } from "@/lib/imageHelpers";
import {
  buildBreadcrumbJsonLd,
  buildDirectoryStudioJsonLd,
  buildPageMetadata,
  buildStudioJsonLd,
  studioMetaDescription,
  studioPageTitle,
} from "@/lib/seo";
import type { DirectoryStudioDetail, StudioPublic } from "@/types/studio";

import { DirectoryStudioPage } from "./DirectoryStudioPage";

interface StudioPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * One URL, two stores.
 *
 * A **managed** studio is a `Studio` row. An **unclaimed directory** studio is a row in
 * `directory_studios` and has no `Studio` at all — one is minted at claim, and the slug moves
 * with it. That hand-over is what keeps the URL stable through a claim: the page is published
 * and indexed before, during and after, which is the point of a claim funnel that does not
 * punish the action it wants.
 *
 * The managed lookup is tried first and the directory is the fallback. The two sets never
 * overlap — the backend asserts it — so the order is about cost, not correctness.
 */
async function resolve(slug: string) {
  const studio = await getStudio(slug);
  if (studio) return { kind: "managed" as const, studio };

  const listing = await getDirectoryStudio(slug);
  if (listing) return { kind: "directory" as const, listing };

  return null;
}

/** The breadcrumb as structured data — the same trail `DirectoryBreadcrumb` renders on an
 *  unclaimed listing. The city is a step only when it has a page; a studio in a town below
 *  the threshold has a city name and nowhere to link it. A managed studio's payload does not
 *  know its city page, so its trail is the directory and the studio. */
function studioBreadcrumb(
  slug: string,
  name: string,
  city?: { name: string | null; slug: string | null },
) {
  return buildBreadcrumbJsonLd([
    { name: "Studia jogi", path: "/studia" },
    ...(city?.name && city.slug ? [{ name: city.name, path: cityStudiosPath(city.slug) }] : []),
    { name, path: `/studio/${slug}` },
  ]);
}

function directoryMeta(listing: DirectoryStudioDetail) {
  return {
    title: studioPageTitle(listing.name, listing.city),
    description: studioMetaDescription({
      description: listing.description,
      styles: listing.styles,
      city: listing.city,
      address: listing.address,
    }),
  };
}

function managedMeta(studio: StudioPublic) {
  const city = studio.location?.city;
  return {
    title: studioPageTitle(studio.name, city),
    description: studioMetaDescription({
      description: studio.description,
      styles: studio.yoga_styles.map((style) => style.name),
      city,
      address: studio.address ?? studio.location?.address_line1,
    }),
  };
}

/** The frontend reading of `crud.studio_directory.publicly_listable_studio`. */
function isIndexable(studio: { is_listed?: boolean; is_published?: boolean }): boolean {
  return studio.is_listed !== false && studio.is_published !== false;
}

export async function generateMetadata(
  { params }: StudioPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolve(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === "directory") {
    // A listing only has a URL once it clears the content bar, so anything the directory
    // returns here is indexable by construction — the backend predicate already said so, and
    // it is the same one the sitemap reads.
    return buildPageMetadata({
      project: "workshops",
      ...directoryMeta(resolved.listing),
      path: `/studio/${slug}`,
    });
  }

  const { studio } = resolved;
  const imageUrl = getOgImageUrl(studio.image_ids?.[0] ?? studio.image_id ?? null);

  const metadata = buildPageMetadata({
    project: "workshops",
    ...managedMeta(studio),
    path: `/studio/${slug}`,
    image: imageUrl || undefined,
  });

  // ⚠ The same expression gates the <JsonLd> below, and the backend's
  // `publicly_listable_studio` is its third reading. All three must agree.
  //
  //   !is_published  nobody has cleared this text. A studio claimed out of the directory
  //                  inherits a description nobody at the studio has read.
  //   !is_listed     somebody asked not to be found. The page renders in full to anyone with
  //                  the link and only sets noindex.
  //
  // This page used to noindex on `is_listed` alone while emitting its structured data
  // unconditionally — so the page and the crawler disagreed about whether it existed, and the
  // sitemap sided with the crawler.
  if (!isIndexable(studio)) {
    return { ...metadata, robots: { index: false, follow: false } };
  }

  return metadata;
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { slug } = await params;
  const resolved = await resolve(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === "directory") {
    return (
      <>
        <JsonLd
          data={buildDirectoryStudioJsonLd({
            path: `/studio/${slug}`,
            listing: resolved.listing,
          })}
        />
        <JsonLd
          data={studioBreadcrumb(slug, resolved.listing.name, {
            name: resolved.listing.city,
            slug: resolved.listing.city_slug,
          })}
        />
        <DirectoryStudioPage
          listing={resolved.listing}
          nearby={<SimilarStudios slug={slug} className="px-4 py-5" />}
        />
      </>
    );
  }

  const { studio } = resolved;
  const schedulePreview = await getStudioSchedulePreview(studio.id).catch((error) => {
    console.error("Error fetching studio schedule preview:", error);
    return null;
  });
  const imageUrl = getOgImageUrl(studio.image_ids?.[0] ?? studio.image_id ?? null);

  return (
    <>
      {/* Same predicate as `generateMetadata`'s noIndex above and `publicly_listable_studio`
          on the backend. A noindexed page must not advertise itself in structured data. */}
      {isIndexable(studio) && (
        <>
          <JsonLd
            data={buildStudioJsonLd({
              path: `/studio/${slug}`,
              studio,
              imageUrl: imageUrl || undefined,
            })}
          />
          <JsonLd data={studioBreadcrumb(slug, studio.name)} />
        </>
      )}
      {/* No "Studia jogi w pobliżu" here: a claimed studio's page is its owner's own page, and
          it does not list nearby alternatives. Unclaimed listings carry the block. */}
      <StudioPageContent studio={studio} initialSchedulePreview={schedulePreview} />
    </>
  );
}

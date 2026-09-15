import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

import { StudioPageContent } from "@/components/page-contents/studio/StudioPageContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDirectoryStudio } from "@/lib/api/getCityDirectory";
import { getStudio } from "@/lib/api/getStudio";
import { getStudioSchedulePreview } from "@/lib/api/getStudioSchedulePreview";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildDirectoryStudioJsonLd, buildPageMetadata, buildStudioJsonLd } from "@/lib/seo";

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
      title: `${resolved.listing.name} | joga.yoga`,
      description:
        resolved.listing.description ??
        resolved.listing.address ??
        "Profil studia jogi na joga.yoga",
      path: `/studio/${slug}`,
    });
  }

  const { studio } = resolved;
  const imageUrl = getOgImageUrl(studio.image_ids?.[0] ?? studio.image_id ?? null);

  const metadata = buildPageMetadata({
    project: "workshops",
    title: `${studio.name} | joga.yoga`,
    description: studio.description ?? studio.address ?? "Profil studia jogi na joga.yoga",
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
        <DirectoryStudioPage listing={resolved.listing} />
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
        <JsonLd
          data={buildStudioJsonLd({
            path: `/studio/${slug}`,
            studio,
            imageUrl: imageUrl || undefined,
          })}
        />
      )}
      <StudioPageContent studio={studio} initialSchedulePreview={schedulePreview} />
    </>
  );
}

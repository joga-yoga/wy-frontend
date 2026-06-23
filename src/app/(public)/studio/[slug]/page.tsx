import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

import { StudioPageContent } from "@/components/page-contents/studio/StudioPageContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStudio } from "@/lib/api/getStudio";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildPageMetadata, buildStudioJsonLd } from "@/lib/seo";

interface StudioPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: StudioPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getStudio(slug);

  if (!studio) {
    notFound();
  }

  const title = `${studio.name} | joga.yoga`;
  const description = studio.description ?? studio.address ?? "Profil studia jogi na joga.yoga";
  const imageUrl = getOgImageUrl(studio.image_ids?.[0] ?? studio.image_id ?? null);

  return {
    ...buildPageMetadata({
      project: "workshops",
      title,
      description,
      path: `/studio/${slug}`,
      image: imageUrl || undefined,
    }),
  };
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { slug } = await params;
  const studio = await getStudio(slug);

  if (!studio) {
    notFound();
  }

  const imageUrl = getOgImageUrl(studio.image_ids?.[0] ?? studio.image_id ?? null);

  return (
    <>
      <JsonLd
        data={buildStudioJsonLd({
          path: `/studio/${slug}`,
          studio,
          imageUrl: imageUrl || undefined,
        })}
      />
      <StudioPageContent studio={studio} />
    </>
  );
}

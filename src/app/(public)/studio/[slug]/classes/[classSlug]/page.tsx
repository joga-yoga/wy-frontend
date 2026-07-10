import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getClassTemplateDetail } from "@/lib/api/getClassTemplateDetail";
import { getStudio } from "@/lib/api/getStudio";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildPageMetadata } from "@/lib/seo";

import { ClassLandingPage } from "./ClassLandingPage";

interface Props {
  params: Promise<{ slug: string; classSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug, classSlug } = await params;
  const classTemplate = await getClassTemplateDetail(slug, classSlug);
  if (!classTemplate) return {};

  const imageId = classTemplate.image_ids?.[0];
  const imageUrl = imageId ? getOgImageUrl(imageId) : undefined;

  return {
    ...buildPageMetadata({
      project: "workshops",
      title: `${classTemplate.title} · ${classTemplate.studio.name} | joga.yoga`,
      description: classTemplate.description || "Zobacz szczegóły zajęć na joga.yoga",
      path: `/studio/${slug}/zajecia/${classSlug}`,
      image: imageUrl,
    }),
  };
}

export default async function ClassDetailPage({ params }: Props) {
  const { slug, classSlug } = await params;

  const [studio, classTemplate] = await Promise.all([
    getStudio(slug),
    getClassTemplateDetail(slug, classSlug),
  ]);

  if (!studio || !classTemplate) notFound();

  return (
    <Suspense>
      <ClassLandingPage studio={studio} classTemplate={classTemplate} />
    </Suspense>
  );
}

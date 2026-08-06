import { Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/common/BackButton";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStudio } from "@/lib/api/getStudio";
import { getStudioClassTemplates } from "@/lib/api/getStudioClassTemplates";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

import { ClassCard } from "./components/ClassCard";
import { classCountLabel } from "./types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) return {};

  const { items } = await getStudioClassTemplates(slug);
  const city = studio.location?.city;
  const classTypes = Array.from(
    new Set(items.map((item) => item.style).filter((style): style is string => !!style)),
  ).slice(0, 5);

  const description = [
    `Zajęcia w ${studio.name}${city ? ` (${city})` : ""}`,
    classTypes.length > 0 ? classTypes.join(", ") : null,
  ]
    .filter(Boolean)
    .join(": ");

  const imageUrl = getOgImageUrl(studio.image_ids?.[0] ?? studio.image_id ?? null);

  return buildPageMetadata({
    project: "workshops",
    title: `Zajęcia — ${studio.name} | joga.yoga`,
    description: description || "Zobacz zajęcia dostępne w tym studio na joga.yoga",
    path: `/studio/${slug}/zajecia`,
    image: imageUrl || undefined,
  });
}

export default async function StudioClassesPage({ params }: Props) {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) notFound();

  const { items, total } = await getStudioClassTemplates(slug);

  return (
    <div className="min-h-screen bg-white">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: studio.name, path: `/studio/${slug}` },
          { name: "Zajęcia", path: `/studio/${slug}/zajecia` },
        ])}
      />

      <div className="border-b bg-white px-4 py-4">
        <div className="mb-3">
          <BackButton href={`/studio/${studio.slug}`} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Zajęcia
          <span className="sr-only"> — {studio.name}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">{classCountLabel(total)}</p>

        <Link href={`/studio/${studio.slug}`} className="mt-3 flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md">
            <HashedAvatar
              seed={studio.id}
              name={studio.name}
              imageId={studio.image_id}
              size={32}
              imageFit="contain"
              className="rounded-none bg-white"
            />
          </div>
          <span className="truncate text-sm font-medium text-gray-700">{studio.name}</span>
        </Link>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-8 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4efe8]">
              <Sparkles className="h-6 w-6 text-[#b9a488]" />
            </div>
            <p className="text-sm text-gray-500">To studio nie ma jeszcze zaplanowanych zajęć.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <ClassCard key={item.id} studioSlug={slug} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

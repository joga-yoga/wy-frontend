import { Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClassCard } from "@/app/(public)/studio/[slug]/classes/components/ClassCard";
import { classCountLabel } from "@/app/(public)/studio/[slug]/classes/types";
import { BackButton } from "@/components/common/BackButton";
import { InstructorAvatar } from "@/components/common/InstructorAvatar";
import { JsonLd } from "@/components/seo/JsonLd";
import { getInstructor } from "@/lib/api/getInstructor";
import { getInstructorClassTemplates } from "@/lib/api/getInstructorClassTemplates";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getInstructor(slug);
  if (!data) return {};

  const { items } = await getInstructorClassTemplates(slug);
  const classTypes = Array.from(
    new Set(items.map((item) => item.style).filter((style): style is string => !!style)),
  ).slice(0, 5);

  const description = [
    `Zajęcia prowadzone przez ${data.instructor.name}`,
    classTypes.length > 0 ? classTypes.join(", ") : null,
  ]
    .filter(Boolean)
    .join(": ");

  const imageUrl = getOgImageUrl(data.instructor.image_id);

  return buildPageMetadata({
    project: "workshops",
    title: `Zajęcia — ${data.instructor.name} | joga.yoga`,
    description: description || "Zobacz zajęcia prowadzone przez tego nauczyciela na joga.yoga",
    path: `/instruktor/${slug}/zajecia`,
    image: imageUrl || undefined,
  });
}

export default async function InstructorClassesPage({ params }: Props) {
  const { slug } = await params;
  const data = await getInstructor(slug);
  if (!data) notFound();

  const { instructor } = data;
  const { items, total } = await getInstructorClassTemplates(slug);

  return (
    <div className="min-h-screen bg-white">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: instructor.name, path: `/instruktor/${slug}` },
          { name: "Zajęcia", path: `/instruktor/${slug}/zajecia` },
        ])}
      />

      <div className="border-b bg-white px-4 py-4">
        <div className="mb-3">
          <BackButton href={`/instruktor/${slug}`} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Zajęcia
          <span className="sr-only"> — {instructor.name}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">{classCountLabel(total)}</p>

        <Link href={`/instruktor/${slug}`} className="mt-3 flex items-center gap-2">
          <InstructorAvatar name={instructor.name} imageId={instructor.image_id} size={32} />
          <span className="truncate text-sm font-medium text-gray-700">{instructor.name}</span>
        </Link>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-8 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4efe8]">
              <Sparkles className="h-6 w-6 text-[#b9a488]" />
            </div>
            <p className="text-sm text-gray-500">
              Ten nauczyciel nie ma jeszcze zaplanowanych zajęć.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const primaryStudio = item.studios[0];
              return (
                <ClassCard
                  key={item.id}
                  studioSlug={primaryStudio?.slug ?? ""}
                  item={item}
                  studioName={primaryStudio?.name}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

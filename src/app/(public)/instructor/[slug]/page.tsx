import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

import { InstructorPageContent } from "@/components/page-contents/instructor/InstructorPageContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getInstructor } from "@/lib/api/getInstructor";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildInstructorJsonLd, buildPageMetadata } from "@/lib/seo";

interface InstructorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: InstructorPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getInstructor(slug);

  if (!data) {
    notFound();
  }

  const { instructor } = data;
  const title = `${instructor.name} | joga.yoga`;
  const description =
    instructor.short_bio ?? instructor.description ?? "Profil instruktora na joga.yoga";
  const imageUrl = getOgImageUrl(instructor.image_id);

  return {
    ...buildPageMetadata({
      project: "workshops",
      title,
      description,
      path: `/instructor/${slug}`,
      image: imageUrl || undefined,
    }),
  };
}

export default async function InstructorPage({ params }: InstructorPageProps) {
  const { slug } = await params;

  const data = await getInstructor(slug);

  if (!data) {
    notFound();
  }

  const imageUrl = getOgImageUrl(data.instructor.image_id);

  return (
    <>
      <JsonLd
        data={buildInstructorJsonLd({
          path: `/instructor/${slug}`,
          instructor: data.instructor,
          imageUrl: imageUrl || undefined,
        })}
      />
      <InstructorPageContent data={data} />
    </>
  );
}

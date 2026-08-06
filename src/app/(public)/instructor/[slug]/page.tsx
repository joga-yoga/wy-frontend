import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

import { InstructorPageContent } from "@/components/page-contents/instructor/InstructorPageContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getInstructor } from "@/lib/api/getInstructor";
import { getInstructorSchedulePreview } from "@/lib/api/getInstructorSchedulePreview";
import { getInstructorStudios } from "@/lib/api/getInstructorStudios";
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
      path: `/instruktor/${slug}`,
      image: imageUrl || undefined,
      // Unclaimed placeholder profiles stay fully visible on the site (studio/event/
      // session pages, and this page itself) but are kept out of search indexing until
      // the real person claims them — see .plans/instructor-profile-permissions/.
      noIndex: !instructor.is_published || !instructor.is_claimed,
    }),
  };
}

export default async function InstructorPage({ params }: InstructorPageProps) {
  const { slug } = await params;

  const data = await getInstructor(slug);

  if (!data) {
    notFound();
  }

  const schedulePreview = await getInstructorSchedulePreview(slug).catch((error) => {
    console.error("Error fetching instructor schedule preview:", error);
    return null;
  });
  const studios = await getInstructorStudios(slug).catch((error) => {
    console.error("Error fetching instructor studios:", error);
    return [];
  });
  const imageUrl = getOgImageUrl(data.instructor.image_id);

  return (
    <>
      {data.instructor.is_published && data.instructor.is_claimed && (
        <JsonLd
          data={buildInstructorJsonLd({
            path: `/instruktor/${slug}`,
            instructor: data.instructor,
            imageUrl: imageUrl || undefined,
          })}
        />
      )}
      <InstructorPageContent data={data} schedulePreview={schedulePreview} studios={studios} />
    </>
  );
}

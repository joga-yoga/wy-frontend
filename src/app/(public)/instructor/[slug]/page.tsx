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
      // Two reasons a profile is not indexed, and they are not interchangeable:
      //
      //   !is_published  nobody has approved this text yet — the payload itself is stripped
      //                  to name/photo/slug, so there is barely a page to index.
      //   !is_listed     somebody asked for this profile not to be found. The page renders
      //                  in full and a shared link still works; only search and the
      //                  /instruktorzy directory lose it.
      //
      // `is_claimed` is deliberately absent. It used to noindex every profile a studio had
      // typed in for a person who never signed up (.plans/instructor-profile-permissions),
      // which also kept them out of the sitemap and the directory. Claim status now answers
      // only "who may edit this"; whether a profile is findable is `is_listed`, which a
      // studio can turn off for any profile it manages if the person asks.
      //
      // This condition must stay identical to `crud.instructor.publicly_listable` and to
      // the JSON-LD gate below — a sitemap that advertises a page the page itself tells
      // crawlers to skip is the failure mode all three are kept in step to avoid.
      noIndex: !instructor.is_published || !instructor.is_listed,
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
      {/* Same predicate as `noIndex` above and `publicly_listable` on the backend. */}
      {data.instructor.is_published && data.instructor.is_listed && (
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

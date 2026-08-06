import type { Metadata } from "next";
import { connection } from "next/server";

import { InstructorCtaPageContent } from "@/components/instructor-cta/InstructorCtaPageContent";
import { FEATURED_INSTRUCTOR } from "@/config/instructorCta";
import { getPublicInstructors } from "@/lib/api/getPublicInstructors";
import type { InstructorPublicListItem } from "@/types/instructor";

export const metadata: Metadata = {
  title: "Stwórz stronę nauczyciela jogi | joga.yoga",
  description:
    "Wygeneruj bez rejestracji szkic strony nauczyciela jogi, sprawdź znalezione informacje i opublikuj swój profil na joga.yoga.",
  alternates: {
    canonical: "/instruktor/dodaj",
  },
  openGraph: {
    title: "Stwórz stronę nauczyciela jogi | joga.yoga",
    description:
      "Wygeneruj bez rejestracji szkic strony nauczyciela jogi i zobacz, jak może wyglądać Twój profil.",
    url: "/instruktor/dodaj",
  },
};

export default async function InstructorCtaPage() {
  await connection();

  let additionalInstructors: InstructorPublicListItem[] = [];

  try {
    additionalInstructors = await getPublicInstructors({
      limit: 2,
      excludeSlug: FEATURED_INSTRUCTOR.slug,
    });
  } catch (error) {
    console.error("Failed to load CTA instructor examples:", error);
  }

  return <InstructorCtaPageContent additionalInstructors={additionalInstructors} />;
}

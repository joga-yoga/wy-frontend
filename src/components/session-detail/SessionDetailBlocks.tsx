"use client";

import { IoChevronForward, IoLanguage } from "react-icons/io5";

import type {
  OccurrenceDetail,
  OccurrenceDetailInstructor,
} from "@/app/(public)/studio/[slug]/schedule/types";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { StudioCard } from "@/components/common/StudioCard";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";

/**
 * The instructor / studio / location blocks of a session, shared by the public session drawer
 * and the customer's own reservation screen (WY-73, which asks to "reuse 1:1 blocks from
 * Session Details drawer" — so they are moved here rather than copied).
 *
 * They read `OccurrenceDetail` directly, which is deliberate: both surfaces load the same
 * `GET /public/occurrences/{id}/detail` payload, and a narrower prop type would only mean
 * mapping the same fields into a second shape on the way in.
 */

const LANGUAGE_INSTRUMENTAL: Record<string, string> = {
  polski: "polsku",
  angielski: "angielsku",
  ukraiński: "ukraińsku",
  niemiecki: "niemiecku",
  francuski: "francusku",
  hiszpański: "hiszpańsku",
  rosyjski: "rosyjsku",
  włoski: "włosku",
};

// Older events store ISO 639-1 codes rather than the full Polish word.
const LANGUAGE_CODE_TO_NAME: Record<string, string> = {
  pl: "polski",
  en: "angielski",
  uk: "ukraiński",
  de: "niemiecki",
  fr: "francuski",
  es: "hiszpański",
  ru: "rosyjski",
  it: "włoski",
};

export function languageName(language: string): string {
  return LANGUAGE_CODE_TO_NAME[language.toLowerCase()] ?? language;
}

function instrumental(language: string): string {
  const name = languageName(language);
  return LANGUAGE_INSTRUMENTAL[name.toLowerCase()] ?? name;
}

function joinPolish(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} i ${items[items.length - 1]}`;
}

export function buildLanguageLines(
  sessionLanguage: string | null | undefined,
  instructor: OccurrenceDetailInstructor | null | undefined,
): { sessionLanguageInstrumental: string; extra: string | null } | null {
  if (!sessionLanguage) return null;
  const sessionLanguageInstrumental = instrumental(sessionLanguage);
  const sessionLanguageName = languageName(sessionLanguage).toLowerCase();
  const extraLanguages = (instructor?.languages ?? []).filter(
    (l) => languageName(l).toLowerCase() !== sessionLanguageName,
  );
  if (extraLanguages.length === 0 || !instructor) {
    return { sessionLanguageInstrumental, extra: null };
  }
  const firstName = instructor.name.split(" ")[0];
  const joined = joinPolish(extraLanguages.map(instrumental));
  return {
    sessionLanguageInstrumental,
    extra: `${firstName} mówi także po ${joined} — możesz zwrócić się w swoim języku.`,
  };
}

export function InstructorSection({
  detail,
  showInstructorChange,
}: {
  detail: OccurrenceDetail;
  showInstructorChange: boolean;
}) {
  const instructor = detail.instructor;
  if (!instructor) return null;
  const languageLines = buildLanguageLines(detail.language, instructor);
  const href = instructor.slug ? `/instruktor/${instructor.slug}` : null;

  const row = (
    <div className="flex items-center gap-3">
      <HashedAvatar
        seed={instructor.id}
        name={instructor.name}
        imageId={instructor.image_id}
        size={48}
      />
      <div className="min-w-0 flex-1">
        {showInstructorChange && detail.previous_instructor_name && (
          <p className="truncate text-sm text-gray-400 line-through">
            {detail.previous_instructor_name}
          </p>
        )}
        <p className="truncate text-base font-semibold text-gray-900">{instructor.name}</p>
        {instructor.short_bio && (
          <p className="truncate text-sm text-gray-500">{instructor.short_bio}</p>
        )}
      </div>
      {href && <IoChevronForward className="h-5 w-5 shrink-0 text-gray-500" />}
    </div>
  );

  return (
    <section className="flex flex-col gap-3 px-4 py-4">
      <p className="text-[18px] font-semibold text-[#222222]">Instruktor</p>
      {showInstructorChange && detail.previous_instructor_name && (
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
          <span>Zastępstwo na tych zajęciach</span>
        </div>
      )}
      {href ? <DetailPageLink href={href}>{row}</DetailPageLink> : row}
      {languageLines && (
        <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm leading-relaxed text-gray-600">
          <IoLanguage className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gray-500" />
          <span>
            Zajęcia prowadzone po{" "}
            <strong className="font-semibold text-gray-900">
              {languageLines.sessionLanguageInstrumental}
            </strong>
            .{languageLines.extra && <> {languageLines.extra}</>}
          </span>
        </div>
      )}
    </section>
  );
}

export function StudioSection({ studio }: { studio: OccurrenceDetail["studio"] }) {
  return (
    <section className="space-y-3 px-4 py-4">
      <p className="text-[18px] font-semibold text-[#222222]">Studio</p>
      <StudioCard studio={studio} />
    </section>
  );
}

export function LocationSection({ detail }: { detail: OccurrenceDetail }) {
  const { studio } = detail;
  const location = studio.location;
  const hasLatLng = location?.latitude != null && location?.longitude != null;
  if (!studio.address && !location?.address_line1 && !hasLatLng) return null;

  const publicLocation = {
    title: location?.title ?? studio.name,
    address: studio.address,
    address_line1: location?.address_line1,
    city: location?.city,
    latitude: location?.latitude,
    longitude: location?.longitude,
  };

  return (
    <section className="border-t border-gray-100 px-4 pt-4 pb-8">
      <PublicLocation location={publicLocation} title={studio.name} />
    </section>
  );
}

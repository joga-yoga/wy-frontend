import { formatDateRange } from "@/lib/formatDateRange";
import type { CertificateItem, InstructorDetails, InstructorYogaStyle } from "@/types/instructor";
import type { SocialLinkOut } from "@/types/socialLink";

import type { OrganizerEvent } from "../../organizer/types";
import { formatTime } from "./helpers";

export type InstructorStyleViewModel = {
  id: string;
  name: string;
  description: string | null;
};

export type InstructorCertificateViewModel = {
  name: string;
  imageId: string | null;
};

export type InstructorEventKind = "retreat" | "workshop";

export type InstructorEventCardViewModel = {
  id: string;
  kind: InstructorEventKind;
  href: string | null;
  dateLabel: string;
  timeLabel: string | null;
  title: string;
  excerpt: string;
  priceLabel: string;
  imageId: string | null;
};

export type CompletedItemViewModel = {
  id: string;
  title: string;
  subtitle: string;
  imageId: string | null;
};

export type InstructorHighlightKind =
  | "experience"
  | "certificate"
  | "studio"
  | "location"
  | "language";

export type InstructorHighlightViewModel = {
  id: string;
  kind: InstructorHighlightKind;
  label: string;
};

export type InstructorProfileSection =
  | "hero"
  | "highlights"
  | "retreats"
  | "workshops"
  | "completed"
  | "about"
  | "experience"
  | "certificates"
  | "gallery";

export type InstructorProfileViewModel = {
  hero: {
    name: string;
    roleLabel: "nauczyciel jogi";
    imageId: string | null;
    shortBio: string | null;
    socialLinks: SocialLinkOut[];
  };
  highlights: InstructorHighlightViewModel[];
  bio: string | null;
  languages: { code: string; label: string }[];
  experienceItems: InstructorStyleViewModel[];
  certificates: InstructorCertificateViewModel[];
  galleryImageIds: string[];
  retreats: InstructorEventCardViewModel[];
  workshops: InstructorEventCardViewModel[];
  completedItems: CompletedItemViewModel[];
};

const LANGUAGE_FULL: Record<string, string> = {
  pl: "Polski",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  uk: "Українська",
  cs: "Čeština",
  sk: "Slovenčina",
  nl: "Nederlands",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
};

export function buildInstructorProfileViewModel(
  data: InstructorDetails,
): InstructorProfileViewModel {
  const { instructor } = data;
  const experienceItems = normalizeYogaStyles(instructor.yoga_styles ?? []);
  const certificates = normalizeCertificates(instructor.certificates ?? []);
  const languages = normalizeLanguages(instructor.languages);
  const locations = (instructor.cities ?? [])
    .map(formatCityLabel)
    .filter((name): name is string => Boolean(name));
  const studioName = normalizeLabel(instructor.studio_name);

  return {
    hero: {
      name: normalizeLabel(instructor.name),
      roleLabel: "nauczyciel jogi",
      imageId: normalizeImageId(instructor.image_id),
      shortBio: normalizeText(instructor.short_bio),
      socialLinks: instructor.social_links ?? [],
    },
    highlights: buildHighlights({
      certificates,
      studioName,
      locations,
      experienceItems,
      languages,
    }),
    bio: normalizeText(instructor.description),
    languages,
    experienceItems,
    certificates,
    galleryImageIds: unique(instructor.photo_ids ?? []).slice(0, 4),
    retreats: mapEvents(data.upcoming_retreats ?? [], "retreat"),
    workshops: mapEvents(data.upcoming_workshops ?? [], "workshop"),
    completedItems: mapCompletedEvents([
      ...(data.past_retreats ?? []),
      ...(data.past_workshops ?? []),
      ...(data.past_courses ?? []),
    ]),
  };
}

function buildHighlights({
  certificates,
  studioName,
  locations,
  experienceItems,
  languages,
}: {
  certificates: InstructorCertificateViewModel[];
  studioName: string;
  locations: string[];
  experienceItems: InstructorStyleViewModel[];
  languages: { code: string; label: string }[];
}): InstructorHighlightViewModel[] {
  const highlights: InstructorHighlightViewModel[] = [];
  const primaryCertificate = certificates[0]?.name;
  const primaryLocation = locations[0];
  const experienceLabel = experienceItems
    .slice(0, 2)
    .map((item) => item.name)
    .filter(Boolean)
    .join(" · ");
  const languageLabel = languages
    .map((language) => language.label.toLocaleLowerCase("pl-PL"))
    .join(", ");

  if (primaryCertificate) {
    highlights.push({ id: "certificate", kind: "certificate", label: primaryCertificate });
  }
  if (studioName) {
    highlights.push({ id: "studio", kind: "studio", label: `Studio: ${studioName}` });
  }
  if (primaryLocation) {
    highlights.push({ id: "location", kind: "location", label: primaryLocation });
  }
  if (experienceLabel) {
    highlights.push({ id: "experience", kind: "experience", label: experienceLabel });
  }
  if (languageLabel) {
    highlights.push({ id: "language", kind: "language", label: languageLabel });
  }

  return highlights;
}

function normalizeYogaStyles(styles: InstructorYogaStyle[]): InstructorStyleViewModel[] {
  return styles
    .map((style, index) => {
      const name = normalizeLabel(style.yoga_style?.name ?? style.custom_name);
      if (!name) return null;

      return {
        id: style.id || `style-${index}`,
        name,
        description: normalizeText(style.description),
      };
    })
    .filter((style): style is InstructorStyleViewModel => Boolean(style));
}

type RawCertificate =
  | CertificateItem
  | string
  | { name?: unknown; image_id?: unknown; imageId?: unknown };

function normalizeCertificates(
  rawCertificates: RawCertificate[],
): InstructorCertificateViewModel[] {
  return rawCertificates
    .map((certificate) => {
      if (typeof certificate === "string") {
        const name = normalizeLabel(certificate);
        return name ? { name, imageId: null } : null;
      }

      const name = typeof certificate.name === "string" ? normalizeLabel(certificate.name) : "";
      if (!name) return null;

      const imageId =
        typeof certificate.image_id === "string"
          ? normalizeImageId(certificate.image_id)
          : "imageId" in certificate && typeof certificate.imageId === "string"
            ? normalizeImageId(certificate.imageId)
            : null;

      return { name, imageId };
    })
    .filter((certificate): certificate is InstructorCertificateViewModel => Boolean(certificate));
}

function normalizeLanguages(languages: string[] | null): { code: string; label: string }[] {
  return unique(languages ?? []).map((code) => ({
    code,
    label: LANGUAGE_FULL[code] ?? code.toUpperCase(),
  }));
}

function formatCityLabel(city: { name?: string | null; country?: string | null }): string {
  const name = normalizeLabel(city.name);
  if (!name) return "";

  const country = normalizeLabel(city.country);
  if (!country || name.toLocaleLowerCase("pl-PL") === country.toLocaleLowerCase("pl-PL")) {
    return name;
  }

  return `${name}, ${country}`;
}

function mapEvents(
  events: OrganizerEvent[],
  kind: InstructorEventKind,
): InstructorEventCardViewModel[] {
  return events.slice(0, 4).map((event, index) => ({
    id: event.id || `${kind}-${index}`,
    kind,
    href: event.slug ? `${kind === "retreat" ? "/wyjazdy" : "/wydarzenia"}/${event.slug}` : null,
    dateLabel: formatDateRange(event.start_date, event.end_date),
    timeLabel: formatTime(event.start_date),
    title: normalizeLabel(event.title),
    excerpt: truncateText(event.description, 180),
    priceLabel: formatEventPrice(event.price, event.currency),
    imageId: firstUsableImage(event.image_ids),
  }));
}

function mapCompletedEvents(events: OrganizerEvent[]): CompletedItemViewModel[] {
  return [...events]
    .sort((left, right) => new Date(right.end_date).getTime() - new Date(left.end_date).getTime())
    .slice(0, 3)
    .map((event, index) => ({
      id: event.id || `completed-${index}`,
      title: normalizeLabel(event.title),
      subtitle: formatDateRange(event.start_date, event.end_date),
      imageId: firstUsableImage(event.image_ids),
    }));
}

function formatEventPrice(
  price: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (price === null || price === undefined || Number.isNaN(price)) return "Cena do ustalenia";
  if (price <= 0) return "Bezpłatne";
  return `od ${Math.round(price)} ${currency || "PLN"}`;
}

function firstUsableImage(imageIds: string[] | null | undefined): string | null {
  return imageIds?.map(normalizeImageId).find((id): id is string => Boolean(id)) ?? null;
}

function truncateText(value: string | null | undefined, maxLength: number): string {
  const compact = normalizeText(value)?.replace(/\s+/g, " ") ?? "";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trim()}…`;
}

function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function normalizeLabel(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeImageId(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function unique(values: string[]): string[] {
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim();
    if (normalized && !result.includes(normalized)) {
      result.push(normalized);
    }
  });

  return result;
}

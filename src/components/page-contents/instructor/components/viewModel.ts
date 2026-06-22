import { formatDateRange } from "@/lib/formatDateRange";
import { defaultImagesIds } from "@/lib/getRandomDefaultImageId";
import type { CertificateItem, InstructorDetails, InstructorYogaStyle } from "@/types/instructor";

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
  imageId: string;
  isDemo: boolean;
};

export type StaticClassPreviewItem = {
  id: string;
  dateLabel: string;
  title: string;
  timeLabel: string;
  placeLabel: string;
};

export type StaticCompletedItem = {
  id: string;
  title: string;
  subtitle: string;
  imageId: string;
};

export type InstructorHighlightKind =
  | "certificate"
  | "studio"
  | "location"
  | "experience"
  | "language";

export type InstructorHighlightViewModel = {
  id: string;
  kind: InstructorHighlightKind;
  label: string;
};

export type InstructorProfileViewModel = {
  hero: {
    name: string;
    roleLabel: "nauczyciel jogi";
    imageId: string | null;
    shortBio: string | null;
  };
  highlights: InstructorHighlightViewModel[];
  bio: string;
  languages: { code: string; label: string }[];
  experienceItems: InstructorStyleViewModel[];
  certificates: InstructorCertificateViewModel[];
  galleryImageIds: string[];
  retreats: InstructorEventCardViewModel[];
  workshops: InstructorEventCardViewModel[];
  classesPreview: StaticClassPreviewItem[];
  completedPreview: StaticCompletedItem[];
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

const DEFAULT_BIO =
  "Opis profilu zostanie uzupełniony tak, aby lepiej pokazać charakter praktyki, sposób prowadzenia zajęć i doświadczenie nauczyciela jogi.";

const DEFAULT_SHORT_BIO =
  "Praktyka jogi prowadzona z uważnością na ciało, oddech i indywidualne tempo uczestników.";

export function buildInstructorProfileViewModel(
  data: InstructorDetails,
): InstructorProfileViewModel {
  const { instructor } = data;
  const styles = normalizeYogaStyles(instructor.yoga_styles ?? []);
  const certificates = normalizeCertificates(instructor.certificates ?? []);
  const languages = normalizeLanguages(instructor.languages);
  const locations = (instructor.cities ?? [])
    .map(formatCityLabel)
    .filter((name): name is string => Boolean(name));
  const experienceItems = styles.length > 0 ? styles : fallbackExperienceItems();
  const studioName =
    typeof instructor.studio_name === "string" ? cleanProfileLabel(instructor.studio_name) : "";
  const imageOffset = hashString(instructor.name);

  return {
    hero: {
      name: instructor.name || "Nauczyciel jogi",
      roleLabel: "nauczyciel jogi",
      imageId: instructor.image_id,
      shortBio: cleanProfileText(instructor.short_bio) || DEFAULT_SHORT_BIO,
    },
    highlights: buildHighlights({
      certificates,
      studioName,
      locations,
      experienceItems,
      languages,
    }),
    bio: cleanProfileText(instructor.description) || DEFAULT_BIO,
    languages,
    experienceItems,
    certificates,
    galleryImageIds: buildGalleryImageIds(instructor.photo_ids ?? [], imageOffset),
    retreats: mapEvents(data.upcoming_retreats ?? [], "retreat", imageOffset),
    workshops: mapEvents(data.upcoming_workshops ?? [], "workshop", imageOffset + 7),
    classesPreview: buildClassPreviewItems(),
    completedPreview: buildCompletedPreview(imageOffset + 14),
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
    highlights.push({ id: "language", kind: "language", label: `${languageLabel}` });
  }

  return highlights;
}

function normalizeYogaStyles(styles: InstructorYogaStyle[]): InstructorStyleViewModel[] {
  return styles
    .map((style, index) => {
      const name = (style.yoga_style?.name ?? style.custom_name ?? "").trim();
      if (!name) return null;
      return {
        id: style.id || `style-${index}`,
        name,
        description: cleanProfileText(style.description) || null,
      };
    })
    .filter((style): style is InstructorStyleViewModel => Boolean(style));
}

type RawCertificate =
  | CertificateItem
  | string
  | {
      name?: unknown;
      image_id?: unknown;
      imageId?: unknown;
    };

function normalizeCertificates(
  rawCertificates: RawCertificate[],
): InstructorCertificateViewModel[] {
  return rawCertificates
    .map((certificate) => {
      if (typeof certificate === "string") {
        const name = cleanProfileLabel(certificate);
        return name ? { name, imageId: null } : null;
      }

      const name = typeof certificate.name === "string" ? cleanProfileLabel(certificate.name) : "";
      if (!name) return null;

      const imageId =
        typeof certificate.image_id === "string"
          ? certificate.image_id
          : "imageId" in certificate && typeof certificate.imageId === "string"
            ? certificate.imageId
            : null;

      return { name, imageId };
    })
    .filter((certificate): certificate is InstructorCertificateViewModel => Boolean(certificate));
}

function normalizeLanguages(languages: string[] | null): { code: string; label: string }[] {
  const values = languages && languages.length > 0 ? languages : ["pl"];
  return unique(values.map((code) => code.trim()).filter(Boolean)).map((code) => ({
    code,
    label: LANGUAGE_FULL[code] ?? code.toUpperCase(),
  }));
}

function formatCityLabel(city: { name?: string | null; country?: string | null }): string {
  const name = city.name?.trim();
  if (!name) return "";

  const country = city.country?.trim();
  if (!country || name.toLocaleLowerCase("pl-PL") === country.toLocaleLowerCase("pl-PL")) {
    return name;
  }

  return `${name}, ${country}`;
}

function fallbackExperienceItems(): InstructorStyleViewModel[] {
  return [
    {
      id: "experience-placeholder",
      name: "Praktyka jogi",
      description:
        "Opis doświadczenia w stylach jogi pojawi się po uzupełnieniu profilu przez nauczyciela.",
    },
  ];
}

function mapEvents(
  events: OrganizerEvent[],
  kind: InstructorEventKind,
  imageOffset: number,
): InstructorEventCardViewModel[] {
  if (events.length === 0) {
    return [buildDemoEvent(kind, imageOffset)];
  }

  return events.slice(0, 4).map((event, index) => ({
    id: event.id || `${kind}-${index}`,
    kind,
    href: event.slug ? `${kind === "retreat" ? "/wyjazdy" : "/wydarzenia"}/${event.slug}` : null,
    dateLabel: formatDateRange(event.start_date, event.end_date),
    timeLabel: formatTime(event.start_date),
    title: event.title || (kind === "retreat" ? "Wyjazd jogowy" : "Wydarzenie jogowe"),
    excerpt: truncateText(event.description || fallbackEventExcerpt(kind), 180),
    priceLabel: formatEventPrice(event.price, event.currency),
    imageId: firstUsableImage(event.image_ids) ?? fallbackImageId(imageOffset + index),
    isDemo: false,
  }));
}

function buildDemoEvent(
  kind: InstructorEventKind,
  imageOffset: number,
): InstructorEventCardViewModel {
  const isRetreat = kind === "retreat";
  return {
    id: `${kind}-demo`,
    kind,
    href: null,
    dateLabel: "Wkrótce",
    timeLabel: null,
    title: isRetreat ? "Tytuł wyjazdu" : "Temat wydarzenia",
    excerpt: isRetreat
      ? "Po dodaniu oferty pokażemy tutaj wyjazdy prowadzone przez nauczyciela."
      : "Po dodaniu oferty pokażemy tutaj warsztaty i wydarzenia prowadzone przez nauczyciela.",
    priceLabel: "Cena",
    imageId: fallbackImageId(imageOffset),
    isDemo: true,
  };
}

function fallbackEventExcerpt(kind: InstructorEventKind): string {
  return kind === "retreat"
    ? "Wyjazd jogowy prowadzony w spokojnym rytmie praktyki, odpoczynku i pracy z ciałem."
    : "Wydarzenie jogowe poświęcone praktyce, oddechowi i świadomej pracy z ciałem.";
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
  return imageIds?.find((id) => typeof id === "string" && id.trim().length > 0) ?? null;
}

function buildGalleryImageIds(sourceImageIds: string[], imageOffset: number): string[] {
  const targetCount = 4;
  const ids: string[] = [];

  for (const id of sourceImageIds) {
    addUnique(ids, id);
  }

  for (let i = 0; ids.length < targetCount && i < defaultImagesIds.length; i += 1) {
    addUnique(ids, fallbackImageId(imageOffset + i));
  }

  return ids.slice(0, targetCount);
}

function buildClassPreviewItems(): StaticClassPreviewItem[] {
  const templates = [
    { offset: 2, title: "Poranna Vinyasa", timeLabel: "08:00-09:15", placeLabel: "Studio" },
    { offset: 4, title: "Joga łagodna", timeLabel: "18:00-19:15", placeLabel: "Sala kameralna" },
    {
      offset: 7,
      title: "Yin joga i oddech",
      timeLabel: "19:30-20:45",
      placeLabel: "Studio / online",
    },
    { offset: 9, title: "Medytacja i relaks", timeLabel: "10:00-11:00", placeLabel: "Studio" },
  ];

  const today = new Date();
  return templates.map((item, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + item.offset);
    return {
      id: `class-preview-${index}`,
      dateLabel: formatClassDate(date),
      title: item.title,
      timeLabel: item.timeLabel,
      placeLabel: item.placeLabel,
    };
  });
}

function buildCompletedPreview(imageOffset: number): StaticCompletedItem[] {
  return [
    {
      id: "completed-retreat",
      title: "Weekend praktyki",
      subtitle: "Kameralne spotkanie z jogą, oddechem i regeneracją.",
      imageId: fallbackImageId(imageOffset),
    },
    {
      id: "completed-workshop",
      title: "Warsztat tematyczny",
      subtitle: "Praca z ciałem, uważnością i spokojnym rytmem praktyki.",
      imageId: fallbackImageId(imageOffset + 1),
    },
    {
      id: "completed-class",
      title: "Cykl zajęć",
      subtitle: "Regularne spotkania budujące stabilność i swobodę ruchu.",
      imageId: fallbackImageId(imageOffset + 2),
    },
  ];
}

function formatClassDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat("pl-PL", { weekday: "short" })
    .format(date)
    .replace(".", "");
  const dayMonth = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" })
    .format(date)
    .replace(".", "");
  return `${capitalize(weekday)}, ${dayMonth}`;
}

function truncateText(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trim()}…`;
}

function cleanProfileText(value: string | null | undefined): string {
  if (!value) return "";

  const blockedFragments = [
    "automatycznie",
    "do weryfikacji",
    "informacje częściowo",
    "po założeniu konta",
    "proszę zweryfikować",
    "przed publikacją",
    "publiczne źródła",
    "publicznych źródeł",
    "szkic",
    "weryfik",
  ];

  return value
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => {
      const lower = sentence.toLowerCase();
      return !blockedFragments.some((fragment) => lower.includes(fragment));
    })
    .join(" ")
    .trim();
}

function cleanProfileLabel(value: string): string {
  return cleanProfileText(value)
    .replace(/\s+[—-]\s*(wymienione|opisane|potwierdzone|znalezione)\b.*$/i, "")
    .trim();
}

function fallbackImageId(index: number): string {
  const normalized =
    ((index % defaultImagesIds.length) + defaultImagesIds.length) % defaultImagesIds.length;
  return defaultImagesIds[normalized];
}

function addUnique(target: string[], value: string | null | undefined) {
  const normalized = value?.trim();
  if (normalized && !target.includes(normalized)) {
    target.push(normalized);
  }
}

function unique(values: string[]): string[] {
  return values.reduce<string[]>((acc, value) => {
    addUnique(acc, value);
    return acc;
  }, []);
}

function hashString(value: string): number {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

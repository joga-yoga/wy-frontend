import { defaultImagesIds } from "@/lib/getRandomDefaultImageId";
import type { InstructorDetails } from "@/types/instructor";

import {
  buildInstructorProfileViewModel,
  type CompletedItemViewModel,
  type InstructorEventCardViewModel,
  type InstructorEventKind,
  type InstructorProfileSection,
  type InstructorProfileViewModel,
} from "../page-contents/instructor/components/viewModel";

export type InstructorPreviewViewModel = {
  profile: InstructorProfileViewModel;
  sampleSections: Partial<Record<InstructorProfileSection, true>>;
};

const SAMPLE_SHORT_BIO =
  "Praktyka jogi prowadzona z uważnością na ciało, oddech i indywidualne tempo uczestników.";

const SAMPLE_BIO =
  "Pomagam budować spokojną, regularną praktykę opartą na świadomym ruchu i oddechu. Zajęcia tworzę tak, aby każdy mógł znaleźć bezpieczną przestrzeń dla siebie i rozwijać jogę we własnym tempie.";

export function buildInstructorPreviewViewModel(
  data: InstructorDetails,
): InstructorPreviewViewModel {
  const source = buildInstructorProfileViewModel(data);
  const sampleSections: Partial<Record<InstructorProfileSection, true>> = {};
  const imageOffset = hashString(source.hero.name);

  const hero = { ...source.hero };
  if (!hero.name) {
    hero.name = "Nauczyciel jogi";
    sampleSections.hero = true;
  }
  if (!hero.imageId) {
    hero.imageId = sampleImage(imageOffset);
    sampleSections.hero = true;
  }
  if (!hero.shortBio) {
    hero.shortBio = SAMPLE_SHORT_BIO;
    sampleSections.hero = true;
  }

  const highlights = [...source.highlights];
  if (highlights.length === 0) {
    highlights.push(
      { id: "sample-location", kind: "location", label: "Warszawa" },
      { id: "sample-experience", kind: "experience", label: "Hatha · Vinyasa" },
      { id: "sample-language", kind: "language", label: "polski, angielski" },
    );
    sampleSections.highlights = true;
  }

  const experienceItems =
    source.experienceItems.length > 0
      ? source.experienceItems
      : [
          {
            id: "sample-hatha",
            name: "Hatha joga",
            description: "Spokojna praktyka budująca stabilność, mobilność i świadomość ciała.",
          },
          {
            id: "sample-vinyasa",
            name: "Vinyasa",
            description: "Płynne sekwencje prowadzone w rytmie oddechu.",
          },
        ];
  if (source.experienceItems.length === 0) {
    sampleSections.experience = true;
  }

  const certificates =
    source.certificates.length > 0
      ? source.certificates
      : [
          { name: "Kurs nauczycielski jogi 200h", imageId: null },
          { name: "Szkolenie z pracy z oddechem", imageId: null },
        ];
  if (source.certificates.length === 0) {
    sampleSections.certificates = true;
  }

  const galleryImageIds = [...source.galleryImageIds];
  for (let index = 0; galleryImageIds.length < 4; index += 1) {
    const imageId = sampleImage(imageOffset + index + 1);
    if (!galleryImageIds.includes(imageId)) {
      galleryImageIds.push(imageId);
    }
  }
  if (galleryImageIds.length > source.galleryImageIds.length) {
    sampleSections.gallery = true;
  }

  const retreats = addEventSamples(source.retreats, "retreat", imageOffset + 7);
  if (retreats.hasSamples) {
    sampleSections.retreats = true;
  }

  const workshops = addEventSamples(source.workshops, "workshop", imageOffset + 11);
  if (workshops.hasSamples) {
    sampleSections.workshops = true;
  }

  const completedItems = addCompletedSamples(source.completedItems, imageOffset + 15);
  if (completedItems.hasSamples) {
    sampleSections.completed = true;
  }

  const bio = source.bio ?? SAMPLE_BIO;
  if (!source.bio) {
    sampleSections.about = true;
  }

  return {
    profile: {
      ...source,
      hero,
      highlights,
      bio,
      experienceItems,
      certificates,
      galleryImageIds,
      retreats: retreats.items,
      workshops: workshops.items,
      completedItems: completedItems.items,
    },
    sampleSections,
  };
}

function addEventSamples(
  items: InstructorEventCardViewModel[],
  kind: InstructorEventKind,
  imageOffset: number,
): { items: InstructorEventCardViewModel[]; hasSamples: boolean } {
  if (items.length === 0) {
    const isRetreat = kind === "retreat";
    return {
      items: [
        {
          id: `sample-${kind}`,
          kind,
          href: null,
          dateLabel: "Wkrótce",
          timeLabel: null,
          title: isRetreat ? "Weekend z jogą i oddechem" : "Warsztat świadomego ruchu",
          excerpt: isRetreat
            ? "Kameralny wyjazd łączący praktykę jogi, odpoczynek i kontakt z naturą."
            : "Spotkanie poświęcone praktyce, oddechowi i świadomej pracy z ciałem.",
          priceLabel: "Cena do ustalenia",
          imageId: sampleImage(imageOffset),
        },
      ],
      hasSamples: true,
    };
  }

  let hasSamples = false;
  const enrichedItems = items.map((item, index) => {
    const imageId = item.imageId ?? sampleImage(imageOffset + index);
    const excerpt =
      item.excerpt ||
      (kind === "retreat"
        ? "Wyjazd z przestrzenią na praktykę, regenerację i spokojny odpoczynek."
        : "Wydarzenie poświęcone praktyce jogi i świadomej pracy z ciałem.");

    if (!item.imageId || !item.excerpt) {
      hasSamples = true;
    }

    return { ...item, imageId, excerpt };
  });

  return { items: enrichedItems, hasSamples };
}

function addCompletedSamples(
  items: CompletedItemViewModel[],
  imageOffset: number,
): { items: CompletedItemViewModel[]; hasSamples: boolean } {
  if (items.length > 0) {
    let hasSamples = false;
    const enrichedItems = items.map((item, index) => {
      if (item.imageId) return item;
      hasSamples = true;
      return { ...item, imageId: sampleImage(imageOffset + index) };
    });
    return { items: enrichedItems, hasSamples };
  }

  return {
    items: [
      {
        id: "sample-completed-retreat",
        title: "Weekend praktyki",
        subtitle: "Kameralne spotkanie z jogą, oddechem i regeneracją.",
        imageId: sampleImage(imageOffset),
      },
      {
        id: "sample-completed-workshop",
        title: "Warsztat tematyczny",
        subtitle: "Praca z ciałem, uważnością i spokojnym rytmem praktyki.",
        imageId: sampleImage(imageOffset + 1),
      },
    ],
    hasSamples: true,
  };
}

function sampleImage(index: number): string {
  const normalized =
    ((index % defaultImagesIds.length) + defaultImagesIds.length) % defaultImagesIds.length;
  return defaultImagesIds[normalized];
}

function hashString(value: string): number {
  return value.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
}

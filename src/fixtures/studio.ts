import type {
  StudioPass,
  StudioPublic,
  StudioRoom,
  StudioSportCardAcceptance,
} from "@/types/studio";

import { INSTRUCTORS, ROOMS, STUDIO } from "./ids";

/**
 * Bodhi Yoga Shala — the studio every B2B fixture in this directory belongs to.
 *
 * Typed as `StudioPublic` because that is the shape both the public studio page and the partner's
 * own studio screens are built from; there is no separate partner-side studio type to reach for.
 */
export const rooms: StudioRoom[] = [
  { id: ROOMS.main.id, studio_id: STUDIO.id, name: ROOMS.main.name },
  { id: ROOMS.small.id, studio_id: STUDIO.id, name: ROOMS.small.name },
];

export const passes: StudioPass[] = [
  {
    id: "pass-8",
    studio_id: STUDIO.id,
    name: "Karnet 8 wejść",
    price: 320,
    currency: "PLN",
    description: "Ważny 60 dni od zakupu.",
    photo: null,
    duration_days: 60,
    session_count: 8,
  },
  {
    id: "pass-4",
    studio_id: STUDIO.id,
    name: "Karnet 4 wejścia",
    price: 180,
    currency: "PLN",
    description: "Ważny 60 dni od zakupu.",
    photo: null,
    duration_days: 60,
    session_count: 4,
  },
  {
    // Unlimited: `session_count` null alongside a real price. The label that hardcodes
    // "n wejść" has to face this row.
    id: "pass-open",
    studio_id: STUDIO.id,
    name: "Karnet open",
    price: 450,
    currency: "PLN",
    description: "Bez limitu wejść przez 90 dni.",
    photo: null,
    duration_days: 90,
    session_count: null,
  },
];

export const sportCardAcceptances: StudioSportCardAcceptance[] = [
  {
    id: "sca-1",
    studio_id: STUDIO.id,
    sport_card_id: "sc-generic",
    name: "Karta sportowa",
    photo: null,
    description: "Dopłata przy wejściu.",
    fee: 10,
    sport_card: {
      id: "sc-generic",
      name: "Karta sportowa",
      slug: "karta-sportowa",
      photo: null,
      description: null,
    },
  },
];

export const studio: StudioPublic = {
  id: STUDIO.id,
  name: STUDIO.name,
  slug: "bodhi-yoga-shala",
  description:
    "Kameralne studio w centrum Łodzi. Prowadzimy zajęcia hatha, vinyasa i ashtangi, " +
    "w małych grupach i spokojnym tempie.",
  address: "ul. Piotrkowska 112, Łódź",
  image_id: null,
  image_ids: [],
  drop_in_price: 45,
  currency: "PLN",
  accepts_sport_cards: true,
  is_listed: true,
  status: "published",
  rooms,
  passes,
  sport_card_acceptances: sportCardAcceptances,
  amenities: [
    { id: "am-mats", name: "Maty na miejscu", slug: "maty", icon_id: null },
    { id: "am-showers", name: "Prysznice", slug: "prysznice", icon_id: null },
  ],
  yoga_styles: [
    { id: "ys-hatha", name: "Hatha", slug: "hatha", icon_id: null },
    { id: "ys-vinyasa", name: "Vinyasa", slug: "vinyasa", icon_id: null },
    { id: "ys-ashtanga", name: "Asztanga", slug: "asztanga", icon_id: null },
  ],
  instructors: [
    {
      id: INSTRUCTORS.owner.id,
      name: INSTRUCTORS.owner.name,
      slug: "przemek-nadolny",
      image_id: null,
      short_bio: "Uważna praktyka jogi dla ciała, oddechu i spokoju umysłu.",
    },
    {
      id: INSTRUCTORS.linked.id,
      name: INSTRUCTORS.linked.name,
      slug: "marta-zielinska",
      image_id: null,
      short_bio: "Vinyasa w spokojnym tempie, z naciskiem na oddech.",
    },
  ],
  location: {
    title: "Bodhi Yoga Shala",
    address_line1: "ul. Piotrkowska 112",
    city: "Łódź",
    latitude: 51.7592,
    longitude: 19.456,
  },
  social_links: [],
  created_at: "2024-11-04T09:00:00+01:00",
  updated_at: "2026-09-01T12:00:00+02:00",
};

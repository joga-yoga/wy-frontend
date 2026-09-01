import * as yup from "yup";

import type { SocialLinkValue } from "@/components/common/SocialLinksField";

import type { StudioApiResponse, StudioFormValues, StudioLocation, StudioPayload } from "./types";

const emptyToNull = <T>(value: T, originalValue: unknown) =>
  originalValue === "" || originalValue == null ? null : value;

const nullableNumber = yup
  .number()
  .transform(emptyToNull)
  .typeError("Podaj poprawną kwotę")
  .nullable();

export const studioDraftSchema = yup.object({
  name: yup.string().trim().required("Nazwa studia jest wymagana"),
});

export const studioPublishSchema = yup.object({
  name: yup.string().trim().required("Nazwa studia jest wymagana"),
  description: yup.string().nullable().optional(),
  address: yup.string().trim().required("Adres jest wymagany"),
  image_id: yup.string().nullable().optional(),
  image_ids: yup.array().of(yup.string().required()).default([]),
  rooms: yup
    .array()
    .of(yup.object({ name: yup.string().trim().required() }))
    .default([]),
  amenity_ids: yup.array().of(yup.string().required()).default([]),
  instructor_ids: yup.array().of(yup.string().required()).default([]),
  drop_in_price: nullableNumber.optional(),
  currency: yup.string().trim().optional(),
  accepts_sport_cards: yup.boolean().nullable().optional(),
  is_public: yup.boolean().default(false),
  is_listed: yup.boolean().default(true),
});

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// The backend serializes time fields as "HH:MM:SS"; <input type="time"> (no `step`) expects
// "HH:MM" and may fail to display a value with seconds in some browsers.
function toTimeInputValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}

function cleanNumber(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function buildStudioPayload(values: StudioFormValues): StudioPayload {
  // Send the id back for rooms that already exist: the backend reconciles by id, so a
  // room keeps the identity that its schedules and occurrences reference. Dropping it
  // here is what made every save delete and recreate the whole list.
  const rooms = (values.rooms ?? [])
    .filter((r) => r.name.trim())
    .map((r) => ({ id: r.id ?? null, name: r.name.trim() }));

  // Same as rooms: `passes.id` is what /public/passes/{id}/detail and /passes/{id}/purchase
  // resolve by, so it has to survive the round trip or every live purchase link dies.
  const passes = (values.passes ?? [])
    .filter((p) => p.name.trim())
    .map((p) => ({
      id: p.id ?? null,
      name: p.name.trim(),
      price: Number(p.price) || 0,
      currency: cleanString(p.currency),
      description: cleanString(p.description),
      photo: cleanString(p.photo) ?? null,
      duration_days: cleanNumber(p.duration_days),
      session_count: cleanNumber(p.session_count),
    }));

  // `id` here is the studio's acceptance row, not the global sport card (`sport_card_id`).
  // The booking route takes it as `studio_sport_card_id`, so it must survive the round trip.
  const sportCardAcceptances = (values.sport_card_acceptances ?? []).map((sc) => ({
    id: sc.id ?? null,
    sport_card_id: sc.sport_card_id ?? null,
    name: cleanString(sc.name),
    photo: cleanString(sc.photo) ?? null,
    description: cleanString(sc.description),
    fee: cleanNumber(sc.fee),
  }));

  const socialLinks = (values.social_links ?? []).map((link, index) => ({
    url: link.url,
    label: link.platform === "custom" ? cleanString(link.label) : null,
    position: index,
  }));

  return {
    name: values.name.trim(),
    slug: cleanString(values.slug),
    description: cleanString(values.description),
    image_id: cleanString(values.image_id) ?? null,
    image_ids: values.image_ids ?? [],
    address: cleanString(values.address),
    location_id: values.location_id ?? null,
    drop_in_price: cleanNumber(values.drop_in_price),
    currency: values.currency || "PLN",
    accepts_sport_cards: values.accepts_sport_cards,
    is_listed: values.is_listed,
    accepts_cash: values.accepts_cash,
    accepts_stripe: values.accepts_stripe,
    accepts_bank_transfer: values.accepts_bank_transfer,
    cancellation_policy_mode: values.cancellation_policy_mode,
    cancellation_morning_deadline_time: cleanString(values.cancellation_morning_deadline_time),
    cancellation_afternoon_hours_before: cleanNumber(values.cancellation_afternoon_hours_before),
    rooms,
    passes,
    sport_card_acceptances: sportCardAcceptances,
    amenity_ids: values.amenity_ids ?? [],
    instructor_ids: values.instructor_ids ?? [],
    social_links: socialLinks,
  };
}

export function formValuesFromStudio(studio: StudioApiResponse): StudioFormValues {
  return {
    name: studio.name ?? "",
    slug: studio.slug ?? "",
    description: studio.description ?? "",
    image_id: studio.image_id ?? null,
    address: studio.address ?? "",
    location_id: studio.location_id ?? null,
    location: null, // will be loaded separately
    rooms: (studio.rooms ?? []).map((r) => ({ id: r.id, name: r.name })),
    amenity_ids: studio.amenity_ids ?? [],
    instructor_ids: (studio.instructor_links ?? []).map((l) => l.instructor_id),
    instructors: [],
    drop_in_price: studio.drop_in_price ?? "",
    currency: studio.currency ?? "PLN",
    passes: (studio.passes ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency ?? "PLN",
      description: p.description ?? "",
      photo: p.photo ?? null,
      duration_days: p.duration_days ?? null,
      session_count: p.session_count ?? null,
    })),
    accepts_sport_cards: studio.accepts_sport_cards ?? null,
    sport_card_acceptances: (studio.sport_card_acceptances ?? []).map((sc) => ({
      id: sc.id,
      sport_card_id: sc.sport_card_id ?? null,
      name: sc.name ?? null,
      photo: sc.photo ?? null,
      description: sc.description ?? null,
      fee: sc.fee ?? null,
      sport_card: sc.sport_card ?? null,
    })),
    image_ids: studio.image_ids ?? [],
    is_public: studio.is_listed !== false,
    is_listed: studio.is_listed !== false,
    accepts_cash: studio.accepts_cash !== false,
    accepts_stripe: studio.accepts_stripe ?? false,
    accepts_bank_transfer: studio.accepts_bank_transfer ?? false,
    cancellation_policy_mode: studio.cancellation_policy_mode ?? "always_free",
    cancellation_morning_deadline_time: toTimeInputValue(studio.cancellation_morning_deadline_time),
    cancellation_afternoon_hours_before: studio.cancellation_afternoon_hours_before ?? null,
    social_links: (studio.social_links ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((link) => ({
        key: link.id,
        url: link.url,
        platform: link.platform as SocialLinkValue["platform"],
        handle: link.handle,
        label: link.label,
      })),
  };
}

export const emptyStudioFormValues: StudioFormValues = {
  name: "",
  slug: "",
  description: "",
  image_id: null,
  address: "",
  location_id: null,
  location: null,
  rooms: [],
  amenity_ids: [],
  instructor_ids: [],
  instructors: [],
  drop_in_price: "",
  currency: "PLN",
  passes: [],
  accepts_sport_cards: null,
  sport_card_acceptances: [],
  image_ids: [],
  is_public: false,
  is_listed: false,
  accepts_cash: true,
  accepts_stripe: false,
  accepts_bank_transfer: false,
  // Matches the backend column default. `by_time_of_day` requires both deadlines, and those
  // are only settable on the payments screen — defaulting to it here made every payload from
  // this form carry an incomplete policy, so creating or publishing a studio failed with
  // "by_time_of_day cancellation policy requires both ...".
  cancellation_policy_mode: "always_free",
  cancellation_morning_deadline_time: null,
  cancellation_afternoon_hours_before: "",
  social_links: [],
};

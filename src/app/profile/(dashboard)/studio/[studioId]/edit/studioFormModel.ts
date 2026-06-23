import * as yup from "yup";

import type { StudioApiResponse, StudioFormValues, StudioPayload } from "./types";

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
  yoga_style_ids: yup.array().of(yup.string().required()).default([]),
  drop_in_price: nullableNumber.optional(),
  currency: yup.string().trim().optional(),
  accepts_sport_cards: yup.boolean().nullable().optional(),
  is_public: yup.boolean().default(false),
});

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function cleanNumber(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function buildStudioPayload(values: StudioFormValues): StudioPayload {
  const rooms = (values.rooms ?? [])
    .filter((r) => r.name.trim())
    .map((r) => ({ name: r.name.trim() }));

  const passes = (values.passes ?? [])
    .filter((p) => p.name.trim())
    .map((p) => ({
      name: p.name.trim(),
      price: Number(p.price) || 0,
      currency: cleanString(p.currency),
      description: cleanString(p.description),
      photo: cleanString(p.photo) ?? null,
      duration_days: cleanNumber(p.duration_days),
      session_count: cleanNumber(p.session_count),
    }));

  const sportCardAcceptances = (values.sport_card_acceptances ?? []).map((sc) => ({
    sport_card_id: sc.sport_card_id ?? null,
    name: cleanString(sc.name),
    photo: cleanString(sc.photo) ?? null,
    description: cleanString(sc.description),
    fee: cleanNumber(sc.fee),
  }));

  return {
    name: values.name.trim(),
    description: cleanString(values.description),
    image_id: cleanString(values.image_id) ?? null,
    image_ids: values.image_ids ?? [],
    address: cleanString(values.address),
    drop_in_price: cleanNumber(values.drop_in_price),
    currency: values.currency || "PLN",
    accepts_sport_cards: values.accepts_sport_cards,
    rooms,
    passes,
    sport_card_acceptances: sportCardAcceptances,
    amenity_ids: values.amenity_ids ?? [],
    yoga_style_ids: values.yoga_style_ids ?? [],
    instructor_ids: values.instructor_ids ?? [],
  };
}

export function formValuesFromStudio(studio: StudioApiResponse): StudioFormValues {
  return {
    name: studio.name ?? "",
    description: studio.description ?? "",
    image_id: studio.image_id ?? null,
    address: studio.address ?? "",
    rooms: (studio.rooms ?? []).map((r) => ({ id: r.id, name: r.name })),
    amenity_ids: studio.amenity_ids ?? [],
    instructor_ids: (studio.instructor_links ?? []).map((l) => l.instructor_id),
    instructors: [],
    yoga_style_ids: studio.yoga_style_ids ?? [],
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
    is_public: studio.status === "claimed",
  };
}

export const emptyStudioFormValues: StudioFormValues = {
  name: "",
  description: "",
  image_id: null,
  address: "",
  rooms: [],
  amenity_ids: [],
  instructor_ids: [],
  instructors: [],
  yoga_style_ids: [],
  drop_in_price: "",
  currency: "PLN",
  passes: [],
  accepts_sport_cards: null,
  sport_card_acceptances: [],
  image_ids: [],
  is_public: false,
};

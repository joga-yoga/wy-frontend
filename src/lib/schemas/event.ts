import * as yup from "yup";

export interface EventOccurrenceFormValue {
  start_time: string;
  end_time: string;
  label?: string | null;
}

// Base schema for event data validation
export const retreatFormSchema = yup
  .object()
  .shape({
    slug: yup.string().nullable().optional(),
    title: yup
      .string()
      .min(3, "Tytuł musi mieć co najmniej 3 znaki")
      .max(120, "Tytuł może mieć maksymalnie 120 znaków")
      .required("Tytuł jest wymagany."),
    description: yup.string().when("is_public", {
      is: true,
      then: (schema) =>
        schema
          .required("Opis jest wymagany dla wydarzeń publicznych.")
          .max(1000, "Opis może mieć maksymalnie 1000 znaków."),
      otherwise: (schema) => schema.optional(),
    }),
    start_date: yup.string().when("is_public", {
      is: true,
      then: (schema) => schema.required("Data rozpoczęcia jest wymagana dla wydarzeń publicznych."),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    end_date: yup.string().when("is_public", {
      is: true,
      then: (schema) => schema.required("Data zakończenia jest wymagana dla wydarzeń publicznych."),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    price: yup
      .number()
      // .positive("Cena musi być dodatnia")
      .when("is_public", {
        is: true,
        then: (schema) => schema.required("Cena jest wymagana dla wydarzeń publicznych."),
        otherwise: (schema) => schema.optional().nullable(),
      }),
    currency: yup
      .string()
      .length(3, "Waluta musi mieć 3 znaki")
      .when("is_public", {
        is: true,
        then: (schema) => schema.required("Waluta jest wymagana dla wydarzeń publicznych."),
        otherwise: (schema) => schema.optional().nullable(),
      }), // .transform(val => val ? val.toUpperCase() : val) can be added if toUpperCase is a transform
    main_attractions: yup
      .array()
      .of(yup.string().optional())
      .when("is_public", {
        is: true,
        then: (schema) => schema.min(4, "Wymagane jest od 4 głównych atrakcji."),
        otherwise: (schema) => schema.optional().default([]),
      }),
    language: yup.string().optional(),
    skill_level: yup.array().of(yup.string().required()).optional().default([]),
    accommodation_description: yup.string().optional(),
    guest_welcome_description: yup.string().optional(),
    food_description: yup.string().optional(),
    price_includes: yup.array().of(yup.string()).default([""]),
    price_excludes: yup.array().of(yup.string()).default([""]),
    paid_attractions: yup.array().of(yup.string()).default([""]),
    cancellation_policy: yup.string().optional(),
    important_info: yup.string().optional(),
    image_ids: yup
      .array()
      .of(yup.string().required())
      .when("is_public", {
        is: true,
        then: (schema) => schema.min(5, "Wymagane jest co najmniej 5 zdjęć."),
        otherwise: (schema) => schema.optional().default([]),
      }),
    location_id: yup
      .string()
      .nullable()
      .optional()
      .uuid("Nieprawidłowy format ID lokalizacji")
      .when("is_public", {
        is: true,
        then: (schema) => schema.required("Lokalizacja jest wymagana dla wydarzeń publicznych."),
        otherwise: (schema) => schema.nullable().optional(),
      }),
    is_public: yup.boolean().default(false),
    program: yup
      .array()
      .of(
        yup.object().shape({
          description: yup.string().required("Opis jest wymagany."),
          imageId: yup.string().nullable().optional(),
        }),
      )
      .optional()
      .default([]),
    occurrences: yup
      .array()
      .of(
        yup.object().shape({
          start_time: yup.string().required("Data rozpoczęcia jest wymagana."),
          end_time: yup.string().required("Data zakończenia jest wymagana."),
          label: yup.string().nullable().optional(),
        }),
      )
      .optional()
      .default([]),
    instructor_ids: yup
      .array()
      .of(yup.string().required())
      .when("is_public", {
        is: true,
        then: (schema) => schema.min(1, "Wymagany jest co najmniej jeden instruktor."),
        otherwise: (schema) => schema.default([]),
      }),

    // Workshop-only fields
    goals: yup.array().of(yup.string()).optional().default([]),
    tags: yup.array().of(yup.string()).optional().default([]),
    is_online: yup.boolean().optional().default(false),
    is_onsite: yup.boolean().optional().default(false),
    duration_minutes: yup.number().integer().positive().optional().nullable(),
    level: yup.string().optional().nullable(),
    intensity: yup.number().integer().min(1).max(10).optional().nullable(),
    style: yup.string().optional().nullable(),
  })
  .test({
    name: "date-order",
    test(value, context) {
      const { start_date, end_date, is_public } = value;
      if (!is_public || !start_date || !end_date) {
        return true;
      }
      if (typeof start_date === "string" && typeof end_date === "string") {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          if (endDate >= startDate) {
            return true;
          } else {
            return context.createError({
              path: "end_date",
              message: "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.",
            });
          }
        }
      }
      return true;
    },
  });

// Type inferred from the schema for form data
export type EventFormData = yup.InferType<
  typeof retreatFormSchema & {
    location_id: string | null | undefined;
  }
>;

// A lighter variant for workshops (relaxes retreat-only constraints)
export const workshopFormSchema = retreatFormSchema
  .shape({
    main_attractions: yup.array().of(yup.string().optional()).optional().default([]),

    price: yup.number().when("is_public", {
      is: true,
      then: (schema) => schema.required("Cena jest wymagana, ale może być 0."),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    location_id: yup
      .string()
      .nullable()
      .optional()
      .uuid("Nieprawidłowy format ID lokalizacji")
      .when(["is_public", "is_onsite"], {
        is: (is_public: boolean, is_onsite: boolean) => is_public && is_onsite,
        then: (schema) => schema.required("Lokalizacja jest wymagana dla wydarzeń stacjonarnych."),
        otherwise: (schema) => schema.nullable().optional(),
      }),
    occurrences: yup
      .array()
      .of(
        yup.object().shape({
          start_time: yup.string().required("Termin rozpoczęcia jest wymagany."),
          end_time: yup.string().required("Termin zakończenia jest wymagany."),
          label: yup.string().nullable().optional(),
        }),
      )
      .when("is_public", {
        is: true,
        then: (schema) => schema.min(1, "Dodaj co najmniej jeden termin wydarzenia."),
        otherwise: (schema) => schema.default([]),
      }),
  })
  .test({
    name: "require-online-or-onsite",
    test(value, context) {
      const { is_online, is_onsite, is_public } = value;
      if (is_public && is_online === false && is_onsite === false) {
        return context.createError({
          path: "is_onsite",
          message: "Wybierz format wydarzenia.",
        });
      }
      return true;
    },
  });

export const classFormSchema = retreatFormSchema.shape({
  main_attractions: yup.array().of(yup.string().optional()).optional().default([]),
  start_date: yup.string().nullable().optional(),
  end_date: yup.string().nullable().optional(),
  location_id: yup.string().nullable().optional(),
  program: yup.array().optional().default([]),
  instructor_ids: yup.array().of(yup.string().required()).optional().default([]),
  price: yup.number().when("is_public", {
    is: true,
    then: (schema) => schema.required("Cena jest wymagana, ale może być 0."),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  occurrences: yup
    .array()
    .of(
      yup.object().shape({
        start_time: yup.string().required("Termin rozpoczęcia jest wymagany."),
        end_time: yup.string().required("Termin zakończenia jest wymagane."),
        label: yup.string().nullable().optional(),
      }),
    )
    .default([]),
  duration_minutes: yup
    .number()
    .integer("Czas trwania musi być liczbą całkowitą.")
    .positive("Czas trwania musi być dodatni.")
    .when("is_public", {
      is: true,
      then: (schema) => schema.required("Czas trwania jest wymagany."),
      otherwise: (schema) => schema.optional().nullable(),
    }),
  level: yup.string().optional().nullable(),
  intensity: yup
    .number()
    .integer("Intensywność musi być liczbą całkowitą.")
    .min(1, "Intensywność musi być w zakresie 1-10.")
    .max(10, "Intensywność musi być w zakresie 1-10.")
    .optional()
    .nullable(),
  style: yup.string().optional().nullable(),
});

// Define a type for the nested location information in initial event data
interface LocationInitialInfo {
  id: string;
  title: string;
  // Add other fields from the Location object if they are consistently present and needed
  // For example:
  // address_line1?: string | null;
  // country?: string | null;
}

// Type for initial data fetched for editing (might have slightly different structure, e.g., program as string)
export type EventInitialData = Partial<
  Omit<EventFormData, "image"> & {
    image_ids?: string[] | null;
    is_public: boolean;
    location_id?: string | null;
    location?: LocationInitialInfo | null;
    program?: { description: string; imageId?: string | null }[];
    occurrences?: EventOccurrenceFormValue[];
    instructor_ids?: string[];
    price_excludes?: string[];
    skill_level?: string[];
    paid_attractions?: string[];
    main_attractions?: string[];
    slug?: string;
    duration_minutes?: number | null;
    level?: string | null;
    intensity?: number | null;
    style?: string | null;
  }
>;

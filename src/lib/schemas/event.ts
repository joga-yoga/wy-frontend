import * as yup from "yup";

// Base schema for event data validation
export const eventFormSchema = yup
  .object()
  .shape({
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
          .max(500, "Opis może mieć maksymalnie 500 znaków."),
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
      .positive("Cena musi być dodatnia")
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
    instructor_ids: yup
      .array()
      .of(yup.string().required())
      .when("is_public", {
        is: true,
        then: (schema) => schema.min(1, "Wymagany jest co najmniej jeden instruktor."),
        otherwise: (schema) => schema.default([]),
      }),
  })
  .test(
    "date-order",
    "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia",
    function (value) {
      const { start_date, end_date, is_public } = value;
      if (!is_public || !start_date || !end_date) {
        return true;
      }
      if (typeof start_date === "string" && typeof end_date === "string") {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          return endDate >= startDate;
        }
      }
      return true;
    },
  );

// Type inferred from the schema for form data
export type EventFormData = yup.InferType<
  typeof eventFormSchema & {
    location_id: string | null | undefined;
  }
>;

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
    instructor_ids?: string[];
    price_excludes?: string[];
    skill_level?: string[];
    paid_attractions?: string[];
    main_attractions?: string[];
  }
>;

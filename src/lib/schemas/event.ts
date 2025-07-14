import * as yup from "yup";

// Base schema for event data validation
export const eventFormSchema = yup
  .object()
  .shape({
    title: yup
      .string()
      .min(3, "Tytuł musi mieć co najmniej 3 znaki")
      .required("Tytuł jest wymagany."),
    description: yup.string().optional(),
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
    price: yup.number().positive("Cena musi być dodatnia").optional().nullable(), // Yup numbers are nullable by default if optional
    currency: yup.string().length(3, "Waluta musi mieć 3 znaki").optional().nullable(), // .transform(val => val ? val.toUpperCase() : val) can be added if toUpperCase is a transform
    main_attractions: yup.array().of(yup.string()).optional().default([]),
    language: yup.string().optional(),
    skill_level: yup.array().of(yup.string().required()).optional().default([]),
    accommodation_description: yup.string().optional(),
    guest_welcome_description: yup.string().optional(),
    food_description: yup.string().optional(),
    price_excludes: yup.array().of(yup.string()).optional().default([]),
    paid_attractions: yup.array().of(yup.string()).optional().default([]),
    cancellation_policy: yup.string().optional(),
    important_info: yup.string().optional(),
    image_ids: yup.array().of(yup.string().required()).optional().default([]),
    location_id: yup.string().uuid("Nieprawidłowy format ID lokalizacji").nullable().optional(),
    is_public: yup.boolean().default(false),
    price_includes: yup.array().of(yup.string()).optional().default([]),
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
    instructor_ids: yup.array().of(yup.string().required()).default([]),
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
export type EventFormData = yup.InferType<typeof eventFormSchema>;

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

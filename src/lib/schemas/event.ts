import { z } from "zod";

// Base schema reused by API response and potentially form
export const eventBaseSchema = z.object({
  id: z.string().uuid(),
  organizer_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string(), // Keep as string for API, handle conversion
  image_id: z.string().nullable().optional(), // Keep image_id from API response
  is_public: z.boolean().optional(), // Keep is_public from API response
  end_date: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().max(3).nullable().optional(),
  main_attractions: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  skill_level: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  accommodation_description: z.string().nullable().optional(),
  guest_welcome_description: z.string().nullable().optional(),
  food_description: z.string().nullable().optional(),
  price_includes: z.string().nullable().optional(),
  price_excludes: z.string().nullable().optional(),
  itinerary: z.string().nullable().optional(),
  included_trips: z.string().nullable().optional(),
  paid_attractions: z.string().nullable().optional(),
  spa_description: z.string().nullable().optional(),
  cancellation_policy: z.string().nullable().optional(),
  important_info: z.string().nullable().optional(),
  program: z.array(z.string()).nullable().optional(),
  instructor_ids: z.array(z.string().uuid()).optional(), // Optional array of UUIDs
});

// Keep price simple for now, refine if needed after fixing resolver issues
// const priceSchema = z.union([z.number().positive("Cena musi być dodatnia"), z.literal(""), z.null()]).optional();

// Base schema for event data validation
export const eventFormSchema = z
  .object({
    title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki"),
    description: z.string().optional(),
    location: z.string().optional(),
    start_date: z.string().min(1, "Data rozpoczęcia jest wymagana"),
    end_date: z.string().min(1, "Data zakończenia jest wymagana"),
    // Simplify price for now
    price: z.coerce.number().positive("Cena musi być dodatnia").optional(),
    currency: z
      .string()
      .length(3, "Waluta musi mieć 3 znaki")
      .toUpperCase()
      .optional()
      .default("PLN"),
    main_attractions: z.string().optional(),
    language: z.string().optional(),
    skill_level: z.string().optional(),
    country: z.string().optional(),
    accommodation_description: z.string().optional(),
    guest_welcome_description: z.string().optional(),
    food_description: z.string().optional(),
    price_includes: z.string().optional(),
    price_excludes: z.string().optional(),
    itinerary: z.string().optional(),
    included_trips: z.string().optional(),
    paid_attractions: z.string().optional(),
    spa_description: z.string().optional(),
    cancellation_policy: z.string().optional(),
    important_info: z.string().optional(),
    // Ensure program is an array of strings, provide default
    program: z.array(z.string()).default([]),
    image: z
      .any()
      .refine(
        (files) => !files || files.length === 0 || files[0]?.size <= 5 * 1024 * 1024, // 5MB limit
        `Maksymalny rozmiar zdjęcia to 5MB.`,
      )
      .refine(
        (files) =>
          !files ||
          files.length === 0 ||
          ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(files[0]?.type),
        "Akceptowane formaty zdjęć: .jpg, .png, .webp, .gif.",
      )
      .optional(),
    // Ensure instructor_ids is an array of strings, provide default
    instructor_ids: z.array(z.string()).default([]),
    is_public: z.boolean().optional().default(false), // Default to false for creation
    // Add image_id for edit mode reference (read-only, not part of form data normally)
    image_id: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.start_date || !data.end_date || new Date(data.end_date) >= new Date(data.start_date),
    {
      message: "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia",
      path: ["end_date"], // Attach error to end_date field
    },
  );

// Type inferred from the schema for form data
export type EventFormData = z.infer<typeof eventFormSchema>;

// Type for initial data fetched for editing (might have slightly different structure, e.g., program as string)
// Keep this simple for now, adjust if backend sends drastically different format
export type EventInitialData = Partial<
  Omit<EventFormData, "image"> & {
    image_id?: string | null; // Add image_id if fetched
    is_public?: boolean | null; // Explicitly allow null if backend might send it
    // If backend *always* sends program/instructors as arrays, simplify:
    program?: string[];
    instructor_ids?: string[];
    // If backend *might* send program as JSON string:
    // program?: string[] | string;
  }
>;

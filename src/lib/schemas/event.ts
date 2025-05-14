import { z } from "zod";

// Base schema for event data validation
export const eventFormSchema = z
  .object({
    title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki"),
    description: z.string().optional(),
    start_date: z.string().min(1, "Data rozpoczęcia jest wymagana"),
    end_date: z.string().min(1, "Data zakończenia jest wymagana"),
    // Simplify price for now
    price: z.coerce.number().positive("Cena musi być dodatnia").optional(),
    currency: z.string().length(3, "Waluta musi mieć 3 znaki").toUpperCase().optional(),
    main_attractions: z.string().optional(),
    language: z.string().optional(),
    skill_level: z.string().optional(),
    accommodation_description: z.string().optional(),
    guest_welcome_description: z.string().optional(),
    food_description: z.string().optional(),
    price_includes: z.array(z.string()).optional().default([]),
    price_excludes: z.string().optional(),
    itinerary: z.string().optional(),
    included_trips: z.string().optional(),
    paid_attractions: z.string().optional(),
    cancellation_policy: z.string().optional(),
    important_info: z.string().optional(),
    program: z.array(z.string()).default([]),
    instructor_ids: z.array(z.string()).default([]),
    is_public: z.boolean().optional().default(false), // Default to false for creation
    image_id: z.string().optional().nullable(), // Allow null to explicitly remove image
    location_id: z.string().uuid("Nieprawidłowy format ID lokalizacji").nullable().optional(), // Added
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
    image_id?: string | null; // Add image_id if fetched
    is_public?: boolean | null; // Explicitly allow null if backend might send it
    location_id?: string | null; // Remains for cases where only ID is sent or as a fallback
    location?: LocationInitialInfo | null; // Added nested location object from API
    program?: string[];
    instructor_ids?: string[];
  }
>;

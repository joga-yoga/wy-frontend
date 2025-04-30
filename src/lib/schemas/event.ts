import { z } from "zod";

// Define the schema for event form validation
export const eventFormSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().min(1, "Data rozpoczęcia jest wymagana"),
  price: z.coerce.number().min(0, "Cena musi być liczbą dodatnią").optional(),
  currency: z.string().max(3).optional(),
  main_attractions: z.string().optional(),
  language: z.string().optional(),
  skill_level: z.string().optional(),
  country: z.string().optional(),
  accommodation_description: z.string().optional(),
  guest_welcome_description: z.string().optional(),
  food_description: z.string().optional(),
  price_includes: z.string().optional(),
  price_excludes: z.string().optional(),
  duration_days: z.coerce.number().int().positive().optional(),
  itinerary: z.string().optional(),
  included_trips: z.string().optional(),
  paid_attractions: z.string().optional(),
  spa_description: z.string().optional(),
  cancellation_policy: z.string().optional(),
  important_info: z.string().optional(),
  program: z.array(z.string()).optional(),
  image: z.any().optional(),
  instructor_ids: z.array(z.string().uuid()).optional(),
});

// Export the inferred type
export type EventFormData = z.infer<typeof eventFormSchema>;

// Define a type for the initial data received from API (GET /events/{id})
export interface EventInitialData extends Partial<EventFormData> {
  id?: string;
  image_id?: string | null;
  is_public?: boolean;
  program?: string[];
  duration_days?: number;
  // Add other fields returned by the API if needed
}

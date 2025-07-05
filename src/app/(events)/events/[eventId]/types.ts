export interface LocationDetail {
  id: string;
  title: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
}

// Define the structure for an instructor in the event details
export interface InstructorDetail {
  id: string;
  name: string;
  bio: string | null;
  image_id: string | null;
}

// Define the structure for the organizer in the event details
export interface OrganizerDetail {
  id: string; // Assuming organizer has an ID, though schema might not show it at top level
  name: string;
  image_id: string | null;
  phone_number?: string | null;
  // Add other fields like url if available and needed
  // url: string | null;
}

// Define the event structure based on API response (schema.Event)
export interface EventDetail {
  id: string;
  organizer: OrganizerDetail | null; // Updated to nested object
  instructors: InstructorDetail[] | null; // Updated to array of objects
  title: string;
  description: string | null;
  location: LocationDetail | null; // Updated to nested object
  start_date: string; // Date comes as string, needs formatting
  end_date: string | null; // Date comes as string, needs formatting
  image_ids?: string[] | null; // Changed from image_id to image_ids
  is_public: boolean;
  price: number | null;
  currency: string | null;
  main_attractions: string[] | null; // Changed from string to string[]
  language: string | null;
  skill_level: string[] | null; // Changed from string to string[]
  included_trips: string[] | null; // Changed from string to string[]
  food_description: string | null;
  price_includes: string[] | null; // Changed from string to string[]
  price_excludes: string[] | null; // Changed from string to string[]
  accommodation_description: string | null;
  guest_welcome_description: string | null;
  paid_attractions: string[] | null; // Changed from string to string[]
  cancellation_policy: string | null;
  important_info: string | null;
  program: string[] | null; // Program is available
}

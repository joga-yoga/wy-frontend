// Define structure for nested objects based on API response
export interface OrganizerDetail {
  id: string;
  name: string;
  phone_number: string | null;
  email: string;
  image_id: string | null;
  description: string | null;
}

export interface InstructorDetail {
  id: string;
  name: string;
  image_id: string | null;
  bio: string | null;
}

export interface LocationDetail {
  id: string;
  title: string | null;
  country: string | null;
  address_line1: string | null;
  city: string | null;
}

export interface ProgramDay {
  description: string;
  imageId?: string | null;
}

// Define the event structure based on API response (schema.Event)
export interface EventDetail {
  id: string;
  organizer: OrganizerDetail | null;
  instructors: InstructorDetail[] | null;
  title: string;
  description: string | null;
  location: LocationDetail | null;
  start_date: string;
  end_date: string | null;
  image_ids?: string[] | null;
  is_public: boolean;
  price: number | null;
  currency: string | null;
  main_attractions: string[] | null;
  language: string | null;
  skill_level: string[] | null;
  food_description: string | null;
  price_includes: string[] | null;
  price_excludes: string[] | null;
  accommodation_description: string | null;
  guest_welcome_description: string | null;
  paid_attractions: string[] | null;
  cancellation_policy: string | null;
  important_info: string | null;
  program: ProgramDay[] | null;
}

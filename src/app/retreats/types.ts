// Define the structure of a Location object based on the API response
export interface Location {
  id: string;
  title: string | null;
  country: string | null;
  country_code: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  google_place_id: string | null;
}

// Define the structure of an event based on the API response
export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: Location | null;
  price: number | null;
  image_ids?: string[];
  is_public: boolean;
  currency: string | null;
  main_attractions?: string | null;
  language?: string | null;
  skill_level?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  min_child_age?: number | null;
  itinerary?: string | null;
  food_description?: string | null;
  price_includes?: string | null;
  price_excludes?: string | null;
  accommodation_description?: string | null;
  guest_welcome_description?: string | null;
  paid_attractions?: string | null;
  cancellation_policy?: string | null;
  important_info?: string | null;
  program?: ProgramDay[] | null;
  tags?: string[] | null;
}

export interface ProgramDay {
  description: string;
  imageId?: string | null;
}

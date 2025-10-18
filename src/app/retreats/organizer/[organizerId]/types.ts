import { ProgramDay } from "@/app/retreats/types";

export interface OrganizerInfo {
  id: string;
  name: string;
  phone_number: string | null;
  email: string;
  image_id: string | null;
  description: string | null;
  user_id: string;
}

export interface OrganizerEvent {
  accommodation_description: string;
  cancellation_policy: string;
  created_at: string;
  currency: string;
  description: string;
  end_date: string;
  food_description: string;
  guest_welcome_description: string;
  id: string;
  image_ids: string[];
  important_info: string;
  instructor_ids: string[];
  is_public: boolean;
  language: string;
  location: OrganizerLocation;
  main_attractions: string[];
  organizer_id: string;
  paid_attractions: string[];
  price: number;
  price_excludes: string[];
  price_includes: string[];
  program: ProgramDay[];
  published_at: string;
  skill_level: string[];
  start_date: string;
  title: string;
  updated_at: string;
}

export interface OrganizerLocation {
  address_line1: string;
  address_line2: string | null;
  city: string;
  country: string;
  country_code: string;
  created_at: string;
  google_place_id: string;
  id: string;
  latitude: number;
  longitude: number;
  organizer_id: string;
  postal_code: string | null;
  state_province: string;
  title: string;
  updated_at: string;
}

export interface OrganizerDetails {
  organizer: OrganizerInfo;
  upcoming_events: OrganizerEvent[];
  past_events: OrganizerEvent[];
}

export interface OrganizerReview {
  author: string;
  created_at: string;
  rating: number;
  review_text: string;
  id: string;
  image_url: string;
}

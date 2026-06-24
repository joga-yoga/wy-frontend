export interface StudioRoom {
  id?: string;
  name: string;
}

export interface StudioPass {
  id?: string;
  name: string;
  price: number | string;
  currency?: string;
  description?: string;
  photo?: string | null;
  duration_days?: number | string | null;
  session_count?: number | string | null;
}

export interface SportCard {
  id: string;
  name: string;
  slug: string;
  photo?: string | null;
  description?: string | null;
}

export interface StudioSportCard {
  id?: string;
  sport_card_id?: string | null;
  name?: string | null;
  photo?: string | null;
  description?: string | null;
  fee?: number | string | null;
  sport_card?: SportCard | null;
}

export interface Amenity {
  id: string;
  name: string;
  slug: string;
  icon_id?: string | null;
}

export interface StudioInstructor {
  id: string;
  name: string;
  image_id?: string | null;
  is_owned?: boolean;
  is_foreign?: boolean;
}

export interface StudioLocation {
  id: string;
  title?: string | null;
  address_line1?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
}

export interface StudioFormValues {
  name: string;
  slug: string;
  description: string;
  image_id: string | null;
  address: string;
  location_id: string | null;
  location: StudioLocation | null;
  rooms: StudioRoom[];
  amenity_ids: string[];
  instructor_ids: string[];
  instructors: StudioInstructor[];
  yoga_style_ids: string[];
  drop_in_price: number | string;
  currency: string;
  passes: StudioPass[];
  accepts_sport_cards: boolean | null;
  sport_card_acceptances: StudioSportCard[];
  image_ids: string[];
  is_public: boolean;
  is_listed: boolean;
}

export interface StudioApiResponse {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  address?: string | null;
  location_id?: string | null;
  image_id?: string | null;
  image_ids?: string[] | null;
  drop_in_price?: number | null;
  currency?: string | null;
  accepts_sport_cards?: boolean | null;
  is_listed?: boolean;
  status: string;
  rooms: Array<{ id: string; studio_id: string; name: string }>;
  passes: Array<{
    id: string;
    studio_id: string;
    name: string;
    price: number;
    currency?: string | null;
    description?: string | null;
    photo?: string | null;
    duration_days?: number | null;
    session_count?: number | null;
  }>;
  sport_card_acceptances: Array<{
    id: string;
    studio_id: string;
    sport_card_id?: string | null;
    name?: string | null;
    photo?: string | null;
    description?: string | null;
    fee?: number | null;
    sport_card?: SportCard | null;
  }>;
  amenity_ids: string[];
  yoga_style_ids: string[];
  instructor_links: Array<{ instructor_id: string; created_at: string }>;
  created_at: string;
  updated_at: string;
}

export interface StudioPayload {
  name: string;
  slug?: string | null;
  description?: string | null;
  image_id?: string | null;
  image_ids?: string[];
  address?: string | null;
  location_id?: string | null;
  drop_in_price?: number | null;
  currency?: string | null;
  accepts_sport_cards?: boolean | null;
  is_listed?: boolean;
  rooms?: Array<{ name: string }>;
  passes?: Array<{
    name: string;
    price: number;
    currency?: string | null;
    description?: string | null;
    photo?: string | null;
    duration_days?: number | null;
    session_count?: number | null;
  }>;
  sport_card_acceptances?: Array<{
    sport_card_id?: string | null;
    name?: string | null;
    photo?: string | null;
    description?: string | null;
    fee?: number | null;
  }>;
  amenity_ids?: string[];
  yoga_style_ids?: string[];
  instructor_ids?: string[];
}

export interface StudioRoom {
  id: string;
  studio_id: string;
  name: string;
}

export interface StudioPass {
  id: string;
  studio_id: string;
  name: string;
  price: number;
  currency?: string | null;
  description?: string | null;
  photo?: string | null;
  duration_days?: number | null;
  session_count?: number | null;
}

export interface SportCard {
  id: string;
  name: string;
  slug: string;
  photo?: string | null;
  description?: string | null;
}

export interface StudioSportCardAcceptance {
  id: string;
  studio_id: string;
  sport_card_id?: string | null;
  name?: string | null;
  photo?: string | null;
  description?: string | null;
  fee?: number | null;
  sport_card?: SportCard | null;
}

export interface StudioAmenity {
  id: string;
  name: string;
  slug: string;
  icon_id?: string | null;
}

export interface StudioYogaStyle {
  id: string;
  name: string;
  slug: string;
  icon_id?: string | null;
}

export interface StudioInstructor {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  short_bio?: string | null;
}

export interface StudioPublic {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  address?: string | null;
  image_id?: string | null;
  image_ids?: string[] | null;
  drop_in_price?: number | null;
  currency?: string | null;
  accepts_sport_cards?: boolean | null;
  status: string;
  rooms: StudioRoom[];
  passes: StudioPass[];
  sport_card_acceptances: StudioSportCardAcceptance[];
  amenities: StudioAmenity[];
  yoga_styles: StudioYogaStyle[];
  instructors: StudioInstructor[];
  created_at: string;
  updated_at: string;
}

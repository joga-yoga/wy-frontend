import type { SocialLinkOut } from "./socialLink";

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

export interface StudioPublicLocation {
  title?: string | null;
  address_line1?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  is_listed: boolean;
  status: string;
  rooms: StudioRoom[];
  passes: StudioPass[];
  sport_card_acceptances: StudioSportCardAcceptance[];
  amenities: StudioAmenity[];
  /** Computed server-side from the classes with future sessions scheduled here —
   *  never stored on the studio, and not settable from the studio form. */
  yoga_styles: StudioYogaStyle[];
  instructors: StudioInstructor[];
  location?: StudioPublicLocation | null;
  social_links: SocialLinkOut[];
  created_at: string;
  updated_at: string;
}

export interface StudioPublicSearchItem {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  address?: string | null;
  city?: string | null;
  is_claimed: boolean;
}

export interface StudioPublicListItem {
  id: string;
  name: string;
  slug: string;
  image_id?: string | null;
  image_ids: string[];
  address?: string | null;
  city?: string | null;
  yoga_styles: string[];
}

export interface GeneratedStudioProfileDraft {
  draft_id: string;
  public_token: string;
  public_url: string;
  draft_kind: "existing" | "generated";
  status: string;
  profile: StudioPublic;
  sources: Array<Record<string, unknown>>;
  confidence: Record<string, unknown>;
  image_provenance: Record<string, unknown>;
  error_message?: string | null;
  expires_at: string;
}

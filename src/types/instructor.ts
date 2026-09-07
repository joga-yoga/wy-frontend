import type { SocialLinkOut } from "./socialLink";

export interface YogaStyle {
  id: string;
  name: string;
  slug: string;
  icon_id: string | null;
}

export interface InstructorYogaStyle {
  id: string;
  yoga_style_id: string | null;
  custom_name: string | null;
  custom_icon_id: string | null;
  description: string | null;
  yoga_style: YogaStyle | null;
}

export interface InstructorYogaStyleIn {
  yoga_style_id?: string | null;
  custom_name?: string | null;
  custom_icon_id?: string | null;
  description?: string | null;
}

export interface CityItem {
  place_id: string;
  name: string;
  country: string;
}

export interface CertificateItem {
  name: string;
  image_id: string | null;
}

export interface InstructorProfile {
  id: string;
  partner_id: string;
  name: string;
  email: string | null;
  description: string | null;
  short_bio: string | null;
  slug: string | null;
  image_id: string | null;
  languages: string[] | null;
  cities: CityItem[] | null;
  photo_ids: string[] | null;
  certificates: CertificateItem[] | null;
  yoga_styles: InstructorYogaStyle[];
  social_links: SocialLinkOut[];
  created_by_partner_id: string | null;
  claimed_at: string | null;
  is_published: boolean;
  /** The owner's "keep me out of search" switch. Distinct from `is_published`: an unlisted
   * profile still renders its page in full, it is just absent from the instructor directory
   * and the sitemap, and the page marks itself `robots: noindex`. Unpublishing withdraws
   * the content itself. */
  is_listed: boolean;
  published_at: string | null;
  is_claimed: boolean;
  claim_status: "claimed" | "invited" | "invitable" | "legacy" | null;
  created_at: string;
  updated_at: string;
}

export interface InstructorPublic {
  id: string;
  name: string;
  description: string | null;
  short_bio: string | null;
  slug: string | null;
  image_id: string | null;
  languages: string[] | null;
  cities: CityItem[] | null;
  photo_ids: string[] | null;
  certificates: CertificateItem[] | null;
  yoga_styles: InstructorYogaStyle[];
  social_links: SocialLinkOut[];
  is_published: boolean;
  // Genuinely self-claimed vs. a placeholder the organizing partner manages but the real
  // person hasn't claimed yet — used to keep unclaimed profiles out of search indexing.
  is_claimed: boolean;
  // The owner asked to stay out of search. The page still renders normally; only the
  // robots directive and the directory/sitemap membership change.
  is_listed: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstructorPublicListItem {
  name: string;
  slug: string;
  image_id: string;
  cities: CityItem[] | null;
  yoga_styles: InstructorYogaStyle[];
  published_at: string | null;
}

/** One row of the `/instruktorzy` directory — mirrors the backend's `InstructorIndexItem`.
 *
 * Deliberately separate from `InstructorPublicListItem` above, whose `image_id: string` is
 * still true: that one backs the three-row "see also" widget, whose query excludes
 * photoless instructors. The directory lists them, so `image_id` is nullable here and the
 * card falls back to initials. Merging the two would force a null branch into a page that
 * can never hit it, and quietly weaken the widget's guarantee.
 */
export interface InstructorIndexItem {
  id: string;
  name: string;
  slug: string;
  image_id: string | null;
  short_bio: string | null;
  cities: CityItem[] | null;
  yoga_styles: InstructorYogaStyle[];
}

export interface InstructorEventLocation {
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
  postal_code: string | null;
  state_province: string;
  title: string;
  updated_at: string;
}

export interface InstructorEvent {
  slug: string;
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
  location: InstructorEventLocation;
  main_attractions: string[];
  paid_attractions: string[];
  price: number;
  price_excludes: string[];
  price_includes: string[];
  program: { description: string; imageId?: string | null }[];
  published_at: string;
  skill_level: string[];
  start_date: string;
  title: string;
  updated_at: string;
}

export interface InstructorDetails {
  instructor: InstructorPublic;
  upcoming_retreats: InstructorEvent[];
  past_retreats: InstructorEvent[];
  upcoming_workshops: InstructorEvent[];
  past_workshops: InstructorEvent[];
  upcoming_courses: InstructorEvent[];
  past_courses: InstructorEvent[];
}

export interface GeneratedInstructorProfileDraft {
  draft_id: string;
  public_token: string;
  public_url: string;
  status: string;
  profile: InstructorDetails;
  sources: Array<Record<string, unknown>>;
  confidence: Record<string, unknown>;
  image_provenance: Record<string, unknown>;
  error_message: string | null;
  expires_at: string;
}

export interface InstructorUpdatePayload {
  name?: string;
  email?: string | null;
  description?: string | null;
  short_bio?: string | null;
  image_id?: string | null;
  languages?: string[] | null;
  cities?: CityItem[] | null;
  photo_ids?: string[] | null;
  certificates?: CertificateItem[] | null;
  yoga_styles?: InstructorYogaStyleIn[];
  social_links?: Array<{ url: string; label?: string | null; position: number }>;
}

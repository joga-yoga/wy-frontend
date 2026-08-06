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

export interface InstructorDetails {
  instructor: InstructorPublic;
  upcoming_retreats: import("@/components/page-contents/organizer/types").OrganizerEvent[];
  past_retreats: import("@/components/page-contents/organizer/types").OrganizerEvent[];
  upcoming_workshops: import("@/components/page-contents/organizer/types").OrganizerEvent[];
  past_workshops: import("@/components/page-contents/organizer/types").OrganizerEvent[];
  upcoming_courses: import("@/components/page-contents/organizer/types").OrganizerEvent[];
  past_courses: import("@/components/page-contents/organizer/types").OrganizerEvent[];
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

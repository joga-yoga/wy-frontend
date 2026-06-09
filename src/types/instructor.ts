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
  created_by_partner_id: string | null;
  claimed_at: string | null;
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
  created_at: string;
  updated_at: string;
}

export interface InstructorDetails {
  instructor: InstructorPublic;
  upcoming_retreats: import("@/components/page-contents/organizer/types").OrganizerEvent[];
  past_retreats: import("@/components/page-contents/organizer/types").OrganizerEvent[];
  upcoming_workshops: import("@/components/page-contents/organizer/types").OrganizerEvent[];
  past_workshops: import("@/components/page-contents/organizer/types").OrganizerEvent[];
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
}

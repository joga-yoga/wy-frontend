export interface ClassLocation {
  title?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
}

export interface SoloTemplateTerms {
  price?: number | null;
  currency?: string | null;
  location_id?: string | null;
  location?: ClassLocation | null;
  venue_source_studio_id?: string | null;
  venue_source_directory_id?: string | null;
  show_venue_name?: boolean;
  terms_locked?: boolean;
}

import type { ClassColor } from "@/lib/classColors";

export interface ClassTemplate extends SoloTemplateTerms {
  id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  level?: string | null;
  intensity?: number | null;
  style_id?: string | null;
  /** Read-only catalog name behind `style_id`, denormalized by the API for list screens. */
  style?: string | null;
  important_info?: string | null;
  color?: ClassColor | null;
  default_instructor_id?: string | null;
  default_capacity?: number | null;
  image_ids?: string[] | null;
  language?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassTemplateCreate extends SoloTemplateTerms {
  title: string;
  description?: string;
  duration_minutes: number;
  level?: string;
  intensity?: number;
  style_id?: string | null;
  important_info?: string;
  color?: ClassColor | null;
  /** `null` clears it. The backend's PATCH is `exclude_unset`, so an omitted field means
   *  "leave it alone" — only an explicit `null` can remove a template's default instructor. */
  default_instructor_id?: string | null;
  default_capacity?: number;
  image_ids?: string[] | null;
  language?: string;
}

export interface ClassTemplateUpdate extends Partial<ClassTemplateCreate> {}

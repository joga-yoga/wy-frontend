import type { ClassColor } from "@/lib/classColors";

export type { ClassColor };

export interface PublicOccurrence {
  id: string;
  start_time: string;
  end_time: string;
  calendar_date: string;
  template_title: string;
  class_slug?: string | null;
  status: "scheduled" | "cancelled" | string;
  instructor_id?: string | null;
  instructor_name?: string | null;
  instructor_image_id?: string | null;
  studio_id?: string | null;
  studio_name?: string | null;
  studio_image_id?: string | null;
  room_name?: string | null;
  capacity?: number | null;
  spots_remaining?: number | null;
  color?: ClassColor | null;
  important_info?: string | null;
  free_cancellation_deadline?: string | null;
  previous_start_time?: string | null;
  previous_instructor_name?: string | null;
  modified_at?: string | null;
  viewer_has_booking: boolean;
  viewer_booking_id?: string | null;
}

export interface OccurrenceDetailInstructor {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  short_bio?: string | null;
  languages?: string[] | null;
}

export interface OccurrenceDetailStudioPass {
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

export interface OccurrenceDetailSportCard {
  id: string;
  name: string;
  slug: string;
  photo?: string | null;
  description?: string | null;
}

export interface OccurrenceDetailStudioSportCardAcceptance {
  id: string;
  studio_id: string;
  sport_card_id?: string | null;
  name?: string | null;
  photo?: string | null;
  description?: string | null;
  fee?: number | null;
  sport_card?: OccurrenceDetailSportCard | null;
}

export interface OccurrenceDetailStudioLocation {
  title?: string | null;
  address_line1?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OccurrenceDetailStudio {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  address?: string | null;
  drop_in_price?: number | null;
  currency?: string | null;
  accepts_sport_cards?: boolean | null;
  accepts_cash: boolean;
  accepts_stripe: boolean;
  accepts_bank_transfer: boolean;
  passes: OccurrenceDetailStudioPass[];
  sport_card_acceptances: OccurrenceDetailStudioSportCardAcceptance[];
  room_count: number;
  location?: OccurrenceDetailStudioLocation | null;
}

export interface OccurrenceDetailBooking {
  id: string;
  status: string;
  funding_type: "drop_in" | "use_pass" | "sport_card" | "buy_and_use" | "unknown";
  sport_card_surcharge?: number | null;

  // ── money (WY-73) ────────────────────────────────────────────────────────
  /** A payment **method** — "cash" | "blik" | "card" | "transfer" | "wallet". Never a
   *  provider: a studio switching gateway must produce no visible change here. */
  payment_method?: string | null;
  amount_owed?: number | null;
  currency?: string | null;
  /** A pass-funded booking has no order and owes nothing — `true` with no amount. */
  is_paid?: boolean;

  // ── cancellation (WY-73) ─────────────────────────────────────────────────
  /** `null` both when the studio cancels freely and when it never configured a deadline —
   *  the backend deliberately does not distinguish the two. */
  free_cancellation_deadline?: string | null;
  /** Whether the booking can be cancelled at all. **Not** "is it free": a late cancellation
   *  still succeeds, it just costs — see `cancellation_is_free`. */
  can_cancel?: boolean;
  cancellation_is_free?: boolean;
  /** The studio's real rule, in words, resolved server-side. */
  cancellation_policy_text?: string | null;
}

export interface OccurrenceDetail {
  id: string;
  start_time: string;
  end_time: string;
  calendar_date: string;
  status: "scheduled" | "cancelled" | string;
  template_title: string;
  class_slug?: string | null;
  color?: ClassColor | null;
  level?: string | null;
  style?: string | null;
  duration_minutes?: number | null;
  description?: string | null;
  language?: string | null;
  important_info?: string | null;
  room_name?: string | null;
  capacity?: number | null;
  spots_remaining?: number | null;
  free_cancellation_deadline?: string | null;
  is_modified: boolean;
  previous_start_time?: string | null;
  previous_instructor_id?: string | null;
  previous_instructor_name?: string | null;
  modified_at?: string | null;
  instructor?: OccurrenceDetailInstructor | null;
  studio: OccurrenceDetailStudio;
  viewer_booking?: OccurrenceDetailBooking | null;
}

export interface PublicScheduleDaySummary {
  date: string;
  session_count: number;
  occurrences: PublicOccurrence[];
}

export interface PublicScheduleWeekResponse {
  studio_id: string;
  week_start: string;
  week_end: string;
  days: PublicScheduleDaySummary[];
}

export interface PublicSchedulePreviewResponse {
  studio_id: string;
  occurrences: PublicOccurrence[];
}

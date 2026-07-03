export type ClassColor = "rose" | "amber" | "lime" | "teal" | "sky" | "violet" | "slate";

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

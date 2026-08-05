export interface ScheduleOccurrence {
  id: string;
  start_time: string;
  end_time: string;
  calendar_date: string;
  status: string;
  is_modified: boolean;
  template_id: string;
  template_title: string;
  instructor_id?: string | null;
  instructor_name?: string | null;
  room_id?: string | null;
  room_name?: string | null;
  capacity?: number | null;
  fill_count: number;
  notified_count: number;
  /** Set-based, per-occurrence — the live card's data (spec §2.1). Never re-derive client-side. */
  attended_count: number;
  unresolved_count: number;
  studio_id?: string | null;
  studio_name?: string | null;
  instructor_image_id?: string | null;
  color?: string | null;
  /** "WEEKLY" when part of a series, null when the session is one-off. */
  recurrence_frequency?: string | null;
  /** Weekday codes in calendar order, e.g. ["MO", "FR"]. Sorted server-side. */
  recurrence_days?: string[];
}

export interface ScheduleDaySummary {
  date: string;
  session_count: number;
  occurrences: ScheduleOccurrence[];
}

export interface ScheduleWeekResponse {
  studio_id: string;
  week_start: string;
  week_end: string;
  days: ScheduleDaySummary[];
}

export interface SessionDetailResponse {
  id: string;
  calendar_date: string;
  start_time: string;
  end_time: string;
  status: string;
  is_modified: boolean;
  instructor_id: string | null;
  instructor_name: string | null;
  room_id: string | null;
  room_name: string | null;
  capacity: number | null;
  template_id: string;
  template_title: string;
  template_duration_minutes: number;
  studio_id: string;
  studio_name: string;
  schedule_id: string;
  /** Caller's occurrence-role (spec §9) — drives owner (§3) vs. instructor (§8) screen choice. */
  role: "owner" | "instructor";
  is_recurring: boolean;
  series_to_date?: string | null;
  recurrence_frequency?: string | null;
  recurrence_days?: string[];
  /** People notified of the cancellation — 0 unless `status === "cancelled"`. */
  notified_count: number;
}

export interface FieldDiffItem {
  label: string;
  old: string;
  new: string;
}

export interface SessionEditPreviewItem {
  occurrence_id?: string | null;
  calendar_date: string;
  status: "new" | "modified" | "cancelled" | "deleted";
  start_time?: string | null;
  end_time?: string | null;
  instructor_id?: string | null;
  room_id?: string | null;
  capacity?: number | null;
  diffs: FieldDiffItem[];
  booked_count: number;
}

export interface NotificationSummary {
  total_recipients: number;
  total_booked_seats: number;
}

export interface SessionEditPreviewResponse {
  scope: string;
  items: SessionEditPreviewItem[];
  total_affected: number;
  notification_summary: NotificationSummary;
}

export interface SessionEditCommitResponse {
  scope: string;
  updated: string[];
  created: string[];
  cancelled: string[];
  deleted: string[];
}

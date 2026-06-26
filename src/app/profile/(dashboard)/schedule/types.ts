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
  studio_id?: string | null;
  studio_name?: string | null;
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
}

export interface SessionEditPreviewItem {
  occurrence_id?: string | null;
  calendar_date: string;
  action: "update" | "create" | "cancel" | "delete" | "unchanged";
  start_time?: string | null;
  end_time?: string | null;
  instructor_id?: string | null;
  room_id?: string | null;
  capacity?: number | null;
}

export interface SessionEditPreviewResponse {
  scope: string;
  items: SessionEditPreviewItem[];
  total_affected: number;
}

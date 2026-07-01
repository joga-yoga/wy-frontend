export interface PublicOccurrence {
  id: string;
  start_time: string;
  end_time: string;
  calendar_date: string;
  template_title: string;
  instructor_id?: string | null;
  instructor_name?: string | null;
  instructor_image_id?: string | null;
  room_name?: string | null;
  capacity?: number | null;
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

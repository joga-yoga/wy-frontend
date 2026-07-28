export interface ScheduleCreatePayload {
  template_id: string;
  studio_id: string;
  room_id?: string;
  capacity?: number;
  instructor_ids?: string[];
  frequency: "once" | "weekly";
  days?: string[];
  from_date: string;
  to_date: string;
  start_time: string;
}

export interface PreviewOccurrence {
  calendar_date: string;
  start_time: string;
  end_time: string;
  instructor_id?: string | null;
  room_id?: string | null;
  capacity?: number | null;
}

export interface SchedulePreviewResponse {
  occurrences: PreviewOccurrence[];
  total: number;
}

export interface ScheduleCreateResponse {
  schedule_id: string;
  occurrences: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    calendar_date: string;
  }[];
  total_created: number;
}

export interface StudioOption {
  id: string;
  name: string;
}

export interface RoomOption {
  id: string;
  name: string;
}

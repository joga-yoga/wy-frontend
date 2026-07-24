import type {
  PublicOccurrence,
  PublicScheduleDaySummary,
} from "@/app/(public)/studio/[slug]/schedule/types";

export type { PublicOccurrence, PublicScheduleDaySummary };

export interface InstructorPublicSchedulePreviewResponse {
  instructor_id: string;
  occurrences: PublicOccurrence[];
}

export interface InstructorPublicScheduleWeekResponse {
  instructor_id: string;
  week_start: string;
  week_end: string;
  days: PublicScheduleDaySummary[];
}

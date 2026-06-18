import {
  EventDetail,
  InstructorDetail,
  LocationDetail,
  OrganizerDetail,
} from "@/app/(public)/retreats/[slug]/types";

export interface CourseModule {
  title: string;
  description?: string | null;
  hours?: number | null;
  topics?: string[] | null;
}

export interface CourseCertification {
  type: "recognized" | "school" | "other";
  designation?: string | null;
  issuing_body?: string | null;
  hours?: number | null;
  name?: string | null;
}

export interface CourseEventDetail extends EventDetail {
  is_online?: boolean | null;
  is_onsite?: boolean | null;
  is_teacher_training?: boolean | null;
  modules?: CourseModule[] | null;
  includes?: string[] | null;
  prerequisites?: string | null;
  certification?: CourseCertification | null;
  enrollment_closes?: string | null;
  goals?: string[] | null;
  tags?: string[] | null;
  total_hours?: number | null;
  deposit_amount?: number | null;
  balance_payment_methods?: string[] | null;
  payment_terms?: string | null;
}

export type { InstructorDetail, LocationDetail, OrganizerDetail };

export type CourseFormat = "onsite" | "hybrid" | "online";

export type CertificationDesignation = "RYT_200" | "RYT_300" | "RYT_500" | "RYS" | "YACEP";

export type CertificationChoice =
  | "none"
  | "school"
  | "other"
  | `recognized:${CertificationDesignation}`;

export interface CourseCertification {
  type: "recognized" | "school" | "other";
  designation?: CertificationDesignation | null;
  issuing_body?: string | null;
  hours?: number | null;
  name?: string | null;
}

export interface CourseModuleValue {
  title: string;
  hours?: number | string | null;
  description?: string | null;
}

export interface CourseInstructor {
  id: string;
  name: string;
  email?: string | null;
  description?: string | null;
  image_id: string | null;
  claim_status?: string | null;
  is_claimed?: boolean;
  claimed_at?: string | null;
  is_foreign?: boolean;
  is_owned?: boolean;
}

export interface CourseLocation {
  id: string;
  title: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  google_place_id?: string | null;
}

export type PaymentMethod = "online" | "cash" | "bank_transfer";

export interface CourseFormValues {
  title: string;
  description?: string | null;
  is_teacher_training: boolean;
  is_online: boolean;
  is_onsite: boolean;
  start_date?: string | null;
  end_date?: string | null;
  enrollment_closes?: string | null;
  harmonogram?: string | null;
  modules: CourseModuleValue[];
  instructor_ids: string[];
  instructors: CourseInstructor[];
  certificationChoice: CertificationChoice;
  certificationName?: string | null;
  certification?: CourseCertification | null;
  price?: number | string | null;
  currency: string;
  deposit_amount?: number | string | null;
  balance_payment_methods: PaymentMethod[];
  payment_terms?: string | null;
  goals: string[];
  includes: string[];
  prerequisites?: string | null;
  skill_level?: string | null;
  cancellation_policy?: string | null;
  important_info?: string | null;
  location_id?: string | null;
  location?: CourseLocation | null;
  image_ids: string[];
  is_public: boolean;
}

export interface CourseApiResponse {
  id: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_public?: boolean;
  published_at?: string | null;
  price?: number | null;
  currency?: string | null;
  deposit_amount?: number | null;
  balance_payment_methods?: PaymentMethod[] | string[] | null;
  payment_terms?: string | null;
  is_teacher_training?: boolean | null;
  is_online?: boolean | null;
  is_onsite?: boolean | null;
  skill_level?: string[] | null;
  modules?: CourseModuleValue[] | null;
  goals?: string[] | null;
  includes?: string[] | null;
  prerequisites?: string | null;
  certification?: CourseCertification | null;
  enrollment_closes?: string | null;
  harmonogram?: string | null;
  important_info?: string | null;
  cancellation_policy?: string | null;
  location?: CourseLocation | null;
  image_ids?: string[] | null;
  instructors?: CourseInstructor[] | null;
}

export type CoursePayload = Omit<
  CourseFormValues,
  | "certificationChoice"
  | "certificationName"
  | "instructors"
  | "location"
  | "description"
  | "start_date"
  | "end_date"
  | "enrollment_closes"
  | "harmonogram"
  | "modules"
  | "certification"
  | "price"
  | "deposit_amount"
  | "prerequisites"
  | "skill_level"
  | "cancellation_policy"
  | "important_info"
  | "payment_terms"
  | "location_id"
  | "image_ids"
> & {
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  enrollment_closes: string | null;
  harmonogram: string | null;
  modules: Array<{ title: string; hours?: number; description?: string }>;
  certification: CourseCertification | null;
  price: number | null;
  deposit_amount: number | null;
  prerequisites: string | null;
  skill_level: string[];
  cancellation_policy: string | null;
  important_info: string | null;
  payment_terms: string | null;
  location_id: string | null;
  image_ids: string[];
};

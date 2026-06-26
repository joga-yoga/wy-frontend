export interface ClassTemplate {
  id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  level?: string | null;
  intensity?: number | null;
  style?: string | null;
  important_info?: string | null;
  default_instructor_id?: string | null;
  default_capacity?: number | null;
  image_ids?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ClassTemplateCreate {
  title: string;
  description?: string;
  duration_minutes: number;
  level?: string;
  intensity?: number;
  style?: string;
  important_info?: string;
  default_instructor_id?: string;
  default_capacity?: number;
  image_ids?: string[];
}

export interface ClassTemplateUpdate extends Partial<ClassTemplateCreate> {}

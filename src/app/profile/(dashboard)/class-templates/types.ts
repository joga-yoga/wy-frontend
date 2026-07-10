import type { ClassColor } from "@/lib/classColors";

export interface ClassTemplate {
  id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  level?: string | null;
  intensity?: number | null;
  style?: string | null;
  important_info?: string | null;
  color?: ClassColor | null;
  default_instructor_id?: string | null;
  default_capacity?: number | null;
  image_ids?: string[] | null;
  language?: string | null;
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
  color?: ClassColor | null;
  default_instructor_id?: string;
  default_capacity?: number;
  image_ids?: string[] | null;
  language?: string;
}

export interface ClassTemplateUpdate extends Partial<ClassTemplateCreate> {}

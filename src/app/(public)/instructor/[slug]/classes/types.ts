export interface InstructorClassTemplateStudioSummary {
  id: string;
  slug?: string | null;
  name: string;
  image_id?: string | null;
}

export interface InstructorClassTemplateSummary {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  image_ids?: string[] | null;
  duration_minutes?: number | null;
  level?: string | null;
  style?: string | null;
  studios: InstructorClassTemplateStudioSummary[];
}

export interface InstructorClassTemplateListResponse {
  total: number;
  items: InstructorClassTemplateSummary[];
}

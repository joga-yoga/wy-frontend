export interface ClassTemplateSummary {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  image_ids?: string[] | null;
  duration_minutes?: number | null;
  level?: string | null;
  style?: string | null;
}

export interface ClassTemplateListResponse {
  total: number;
  items: ClassTemplateSummary[];
}

export interface ClassTemplateInstructor {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
}

export interface ClassTemplateStudioSummary {
  id: string;
  slug?: string | null;
  name: string;
  image_id?: string | null;
  address?: string | null;
}

export interface ClassTemplateDetail extends ClassTemplateSummary {
  instructors: ClassTemplateInstructor[];
  studio: ClassTemplateStudioSummary;
}

const LEVEL_LABELS: { [key: string]: string } = {
  beginner: "Początkujący",
  intermediate: "Średni",
  advanced: "Zaawansowany",
  all_levels: "Wszystkie poziomy",
};

export function levelLabel(level?: string | null): string | null {
  if (!level) return null;
  return LEVEL_LABELS[level] ?? level;
}

export function formatClassMetaLine(item: {
  duration_minutes?: number | null;
  level?: string | null;
  style?: string | null;
}): string {
  return [
    item.duration_minutes ? `${item.duration_minutes} min` : null,
    levelLabel(item.level),
    item.style || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

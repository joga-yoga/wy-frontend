export interface BaseEvent {
  id: string;
  slug: string;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  image_ids?: string[];
  image_id?: string;
  is_public: boolean;
}

export type DashboardItem = BaseEvent & { kind: "retreat" | "workshop" | "class" | "course" };

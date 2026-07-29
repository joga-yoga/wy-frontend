/**
 * Partner inbox types, aligned with `app/schemas/inquiry.py`.
 *
 * One entity with a `kind` discriminator replaced the separate reservation/message
 * shapes. Read state is per-partner (`is_read`); handled state is shared across every
 * partner who can see the row (`handled_at` + `handled_by_label`).
 */
export type InquiryKind = "reservation" | "question";
export type InquiryStatus = "open" | "handled";

export interface InquiryAuthor {
  id: string;
  email: string;
}

export interface InquiryItem {
  id: string;
  kind: InquiryKind;
  status: InquiryStatus;
  message: string | null;
  preferred_contact: string | null;
  event_id: string | null;
  event_title: string | null;
  event_type: string | null;
  event_start_date: string | null;
  event_end_date: string | null;
  instructor_id: string | null;
  studio_id: string | null;
  author: InquiryAuthor | null;
  source_label: string | null;
  is_read: boolean;
  handled_at: string | null;
  handled_by_label: string | null;
  created_at: string;
}

export interface InquiryDayGroup {
  day: string;
  items: InquiryItem[];
}

export interface InboxResponse {
  groups: InquiryDayGroup[];
  total: number;
  unread_count: number;
}

/** Flattens the day-grouped feed when a caller only needs a plain list. */
export function flattenInbox(response: InboxResponse): InquiryItem[] {
  return response.groups.flatMap((group) => group.items);
}

// Aligned with wy-backend `schemas/event_organizer.py`: InboxItem / UnifiedInboxResponse.

export type InboxKind =
  | "credit_invite"
  | "claim"
  | "grant_received"
  | "roster_request"
  | "roster_invite";

export type InboxState = "pending" | "accepted" | "rejected" | "expired" | "info";

export interface InboxItem {
  kind: InboxKind;
  id: string;
  title: string | null;
  subtitle: string | null;
  resource_kind: string | null;
  resource_id: string | null;
  actionable: boolean;
  created_at: string;
  state: InboxState;
  handled_at: string | null;
  /** Which of *the reader's own* entities this concerns — one account can hold several. */
  target_kind: string | null;
  target_id: string | null;
  target_name: string | null;
  /** The other party — who is asking. */
  actor_name: string | null;
}

export interface UnifiedInboxResponse {
  items: InboxItem[];
  unread_count: number;
}

// Aligned with wy-backend `schemas/instructor.py`: StudioRosterItem / StudioRosterResponse /
// RosterRowState / InstructorResolveRequest / InstructorResolveResponse.

export type RosterRowState = "self" | "linked" | "awaiting" | "no_account";

export interface StudioRosterItem {
  id: string;
  name: string;
  image_id: string | null;
  short_bio: string | null;
  slug: string | null;
  email: string | null;
  claim_status: "claimed" | "invited" | "invitable" | "legacy" | null;
  link_status: string;
  initiated_by: string;
  row_state: RosterRowState;
  is_owned: boolean;
  can_edit_profile: boolean;
  added_at: string;
  invited_at: string | null;
}

export interface StudioRosterResponse {
  items: StudioRosterItem[];
  total: number;
  awaiting_count: number;
}

export interface StudioRosterDetachResponse {
  detail: string;
  future_session_count: number;
  has_future_sessions: boolean;
}

export interface InstructorLookupResponse {
  found: "instructor" | "user" | "none";
  instructor_id: string | null;
  name: string | null;
  image_id: string | null;
  slug: string | null;
  short_bio: string | null;
  styles: string[];
  claim_status: "claimed" | "invited" | "invitable" | "legacy" | null;
}

export type InstructorResolveType = "existing_instructor" | "existing_user" | "new_instructor";

export interface InstructorResolveResponse {
  instructor_id: string;
  claim_status: "claimed" | "invited" | "invitable" | "legacy";
  created: boolean;
  name?: string | null;
  image_id?: string | null;
  resolution_type: InstructorResolveType;
  is_owned: boolean;
}

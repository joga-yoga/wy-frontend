export interface RosterEntry {
  booking_id: string;
  user_id: string;
  user_email: string;
  status: string;
  funding_type: string;
  amount_owed?: number | null;
  amount_owed_description?: string | null;
  payment_status?: string | null;
  needs_card_check: boolean;
  checked_in_at?: string | null;
  is_overdue: boolean;
}

export interface FrontDeskSessionSummary {
  occurrence_id: string;
  start_time: string;
  end_time: string;
  template_title: string;
  fill_count: number;
  capacity?: number | null;
}

export interface FrontDeskSessionsResponse {
  date: string;
  sessions: FrontDeskSessionSummary[];
  overdue: RosterEntry[];
}

export type FundingType = "drop_in" | "use_pass" | "sport_card" | "buy_and_use";

export interface WalkInRequest {
  user_id: string;
  funding_type: FundingType;
  user_pass_id?: string;
  studio_sport_card_id?: string;
  pass_id?: string;
}

export interface WalkInUserLookupResponse {
  user_id: string;
  email: string;
}

export interface WalkInCandidate {
  user_id: string;
  email: string;
  name: string | null;
  pass_context: string | null;
}

export interface WalkInSearchResponse {
  studio_clients: WalkInCandidate[];
  other_accounts: WalkInCandidate[];
}

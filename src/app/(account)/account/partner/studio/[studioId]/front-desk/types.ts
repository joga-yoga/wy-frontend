export interface RosterEntry {
  booking_id: string;
  user_id: string;
  user_email: string;
  user_name?: string | null;
  pass_name?: string | null;
  /** null alongside a pass_name = unlimited entries. */
  pass_entries_total?: number | null;
  pass_entries_left?: number | null;
  sport_card_name?: string | null;
  /** Transaction.method, e.g. "cash". */
  payment_method?: string | null;
  status: string;
  funding_type: string;
  amount_owed?: number | null;
  amount_owed_description?: string | null;
  payment_status?: string | null;
  needs_card_check: boolean;
  checked_in_at?: string | null;
  /** Money owed or a card still to check, with no time gate — drives the live roster. */
  needs_settlement?: boolean;
  /** The same question *plus* "and the session already started" — the reconciliation pile. */
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
  /** Scoped to this studio's own clients only — the backend never returns other
   * studios' joga.yoga accounts here (privacy). */
  studio_clients: WalkInCandidate[];
}

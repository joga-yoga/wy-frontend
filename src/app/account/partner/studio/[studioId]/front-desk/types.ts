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
  /** Neither pile is day-scoped — see the type comments below. */
  paid_without_seat: PaidWithoutSeatItem[];
  needs_review: ReviewItem[];
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

// ── T09: the two pinned payment piles ────────────────────────────────────────

/**
 * §7's casualty: the money landed after the seat was already released.
 *
 * ⚠ **Deliberately not a `RosterEntry`.** There is no booking behind it — that was unwound
 * before the payment arrived — and it is not tied to a day. A `RosterEntry` with nulled-out
 * booking fields would have put a "Potwierdź" button next to a row with no seat to confirm.
 */
export interface PaidWithoutSeatItem {
  order_id: string;
  user_id: string;
  user_email: string;
  user_name?: string | null;
  amount_paid: number;
  currency: string;
  item_type: string;
  paid_at?: string | null;
  /** The session the customer thought they had. Null for a pass purchase. */
  occurrence_id?: string | null;
  occurrence_start_time?: string | null;
}

/** Something needing a person: an amount mismatch (§6) or a failed refund (§8). */
export interface ReviewItem {
  id: string;
  source: "amount_mismatch" | "failed_refund";
  detail: string;
  created_at: string;
  order_id: string;
  user_email?: string | null;
  user_name?: string | null;
  amount?: number | null;
  currency?: string | null;
  can_retry_refund: boolean;
}

export interface PaymentAttentionResponse {
  paid_without_seat: PaidWithoutSeatItem[];
  needs_review: ReviewItem[];
}

export interface ExistingPassOption {
  user_pass_id: string;
  pass_name: string;
  entries_remaining?: number | null;
  valid_until?: string | null;
}

export interface SportCardOption {
  studio_sport_card_id: string;
  name?: string | null;
  fee?: number | null;
}

export interface BuyAndUsePassOption {
  pass_id: string;
  name: string;
  price: number;
  currency?: string | null;
  session_count?: number | null;
  duration_days?: number | null;
}

export interface BookingOptionsResponse {
  seat_available: boolean;
  drop_in_price?: number | null;
  currency?: string | null;
  existing_passes: ExistingPassOption[];
  accepts_sport_cards: boolean;
  sport_card_options: SportCardOption[];
  buy_and_use_options: BuyAndUsePassOption[];
  free_cancellation_deadline?: string | null;
}

export type FundingType = "drop_in" | "use_pass" | "sport_card" | "buy_and_use";

export interface BookingCreateRequest {
  funding_type: FundingType;
  user_pass_id?: string;
  studio_sport_card_id?: string;
  pass_id?: string;
}

export interface BookingOut {
  id: string;
  occurrence_id?: string | null;
  user_id: string;
  status: string;
  sport_card_id?: string | null;
  created_at: string;
  amount_owed?: number | null;
  amount_owed_description?: string | null;
  free_cancellation_deadline?: string | null;
}

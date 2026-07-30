// Aligned with wy-backend `schemas/clients.py`.

export type ChipState = "debt" | "pass" | "no_pass" | "expired" | "card";

export interface ClientChipOut {
  state: ChipState;
  amount_due: number | null;
  entries_left: number | null;
  expired_on: string | null;
}

export interface ClientListItem {
  user_id: string;
  email: string;
  name: string | null;
  chip: ClientChipOut;
  last_visit: string | null;
}

export type WalletState = "active" | "used" | "expired" | "cancelled";

export interface PassWalletOut {
  state: WalletState;
  pass_name: string;
  entries_total: number | null;
  entries_left: number | null;
  valid_until: string | null;
  // Purchase facts — "kupiony 2 lip · 150 zł · zapłacony" (K2/K3).
  purchased_at: string | null;
  price: number | null;
  currency: string | null;
  duration_days: number | null;
  // A pass with no order row owes nothing, so the server defaults this to true.
  is_paid: boolean;
}

/** One row of the client's full pass history (K3) — the wallet card plus an id. */
export interface ClientPassOut extends PassWalletOut {
  id: string;
}

export interface ClientVisit {
  booking_id: string;
  occurrence_id: string | null;
  start_time: string | null;
  class_title: string | null;
  status: string;
  funding: string | null;
}

export interface ClientVisitMonth {
  month: string;
  visits: ClientVisit[];
}

export interface ClientDetail {
  user_id: string;
  email: string;
  name: string | null;
  client_since: string | null;
  chip: ClientChipOut;
  wallet: PassWalletOut | null;
  recent_visits: ClientVisit[];
}

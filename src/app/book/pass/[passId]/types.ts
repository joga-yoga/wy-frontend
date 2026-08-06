export interface PassDetailStudio {
  id: string;
  name: string;
  slug?: string | null;
  accepts_cash: boolean;
  accepts_stripe: boolean;
  currency?: string | null;
  drop_in_price?: number | null;
}

export interface PassDetail {
  id: string;
  name: string;
  price: number;
  currency?: string | null;
  description?: string | null;
  photo?: string | null;
  duration_days?: number | null;
  session_count?: number | null;
  studio: PassDetailStudio;
}

export type PassPurchaseScreen = "checkout" | "confirmation";

export interface PassPurchaseOut {
  id: string;
  pass_name: string;
  price: number;
  currency?: string | null;
  entries_total?: number | null;
  valid_until?: string | null;
  amount_owed?: number | null;
  studio_slug?: string | null;
}

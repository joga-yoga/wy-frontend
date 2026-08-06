// Aligned with wy-backend `schemas/account.py`.

export interface MyBookingItem {
  booking_id: string;
  occurrence_id: string | null;
  event_title: string | null;
  event_type: string | null;
  studio_name: string | null;
  start_time: string | null;
  status: string;
  funding: string | null;
  is_past: boolean;
}

export interface MyInquiryItem {
  id: string;
  kind: string;
  status: "open" | "handled";
  event_title: string | null;
  event_type: string | null;
  created_at: string;
  is_past: boolean;
}

export interface MyBookingsResponse {
  bookings: MyBookingItem[];
  inquiries: MyInquiryItem[];
  upcoming_count: number;
  inquiry_count: number;
}

export interface MyPassWalletOut {
  state: "active" | "used" | "expired" | "cancelled";
  pass_name: string;
  entries_total: number | null;
  entries_left: number | null;
  valid_until: string | null;
  // Same purchase facts the B2B side gets — one backend mapping serves both, so the
  // partner's view of a pass and the client's own view cannot disagree.
  purchased_at: string | null;
  price: number | null;
  currency: string | null;
  duration_days: number | null;
  is_paid: boolean;
  studio_id: string;
  studio_name: string;
}

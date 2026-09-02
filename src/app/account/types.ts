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
  /** Class palette colour, so the reservation card draws the same border and bar the
   *  partner's Grafik and the public schedule draw for the same session. Null for a
   *  retreat/workshop/course. */
  color: string | null;
  duration_minutes: number | null;
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
  /** ⚠ Key lists by this, not by `studio_id`. `GET /users/me/passes` returns **every** pass
   *  since WY-71, so a customer with two passes at one studio produces two rows with the same
   *  `studio_id` — which is exactly the case the endpoint change exists to make visible. */
  id: string;
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

/** One entry spent from a pass. Cancelled rows are included and marked — a returned entry is
 *  part of the story of where the pass went, and hiding it makes the remaining count look
 *  wrong to anyone counting the rows. */
export interface MyPassUsageEntry {
  booking_id: string;
  status: string;
  session_title: string | null;
  studio_name: string | null;
  starts_at: string | null;
}

export interface MyPassDetailOut extends MyPassWalletOut {
  usage: MyPassUsageEntry[];
}

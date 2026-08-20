import type { StudioPass } from "@/types/studio";

export interface ExistingPassOption {
  user_pass_id: string;
  pass_name: string;
  entries_remaining?: number | null;
  valid_until?: string | null;
}

export interface SportCardOption {
  studio_sport_card_id: string;
  name?: string | null;
  photo?: string | null;
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

/**
 * Online methods, as the customer knows them. Deliberately *methods*, never providers — a
 * studio switching gateway must produce no visible change here, so the gateway's name never
 * crosses the wire in the first place.
 *
 * These are no longer *choices*. They describe what the studio's one online option covers, so
 * the screen can say "BLIK, karta, przelew" under it; the payer picks the actual method on
 * the provider's own page, which asks regardless of what we send.
 */
export type OnlinePaymentMethod = "blik" | "card" | "wallet" | "transfer";

/** What the customer picks, and all the API is sent: pay here, or pay at the studio. */
export type PaymentMethod = "cash" | "online";

export interface BookingOptionsResponse {
  seat_available: boolean;
  drop_in_price?: number | null;
  currency?: string | null;
  existing_passes: ExistingPassOption[];
  accepts_sport_cards: boolean;
  sport_card_options: SportCardOption[];
  buy_and_use_options: BuyAndUsePassOption[];
  free_cancellation_deadline?: string | null;
  /** Empty when the studio has no active provider — cash only, exactly as before. */
  online_payment_methods: OnlinePaymentMethod[];
  accepts_cash: boolean;
}

export type FundingType = "drop_in" | "use_pass" | "sport_card" | "buy_and_use";

export interface BookingCreateRequest {
  funding_type: FundingType;
  user_pass_id?: string;
  studio_sport_card_id?: string;
  pass_id?: string;
  payment_method?: PaymentMethod;
}

/** Step two's response: where to send the payer. No provider identifier, by design. */
export interface StartPaymentResponse {
  redirect_url: string;
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
  funding_type: FundingType | "unknown";
  sport_card_surcharge?: number | null;
  /** Seat held, money not yet requested — the cue to call POST /bookings/{id}/payment. */
  payment_required: boolean;
}

// ── T02: flow state ─────────────────────────────────────────────────

export type BookingScreen = "checkout" | "confirmation";

export type BookingDrawer = "buy-pass" | "sport-card" | null;

/**
 * Everything Method/Confirmation need to render without re-fetching, captured at the moment a
 * Funding-screen row (or a drawer) is selected. Carries enough to build the final
 * BookingCreateRequest 1:1.
 */
export type FundingSelection =
  | {
      kind: "use_pass";
      userPassId: string;
      passName: string;
      entriesRemaining: number | null;
    }
  | { kind: "drop_in"; price: number }
  | {
      kind: "buy_and_use";
      passId: string;
      passName: string;
      price: number;
      currency: string | null;
    }
  | {
      kind: "sport_card";
      studioSportCardId: string;
      cardName: string;
      fee: number | null;
    };

export function toBookingCreateRequest(
  selection: FundingSelection,
  paymentMethod?: PaymentMethod,
): BookingCreateRequest {
  // Selections that skip the Method screen (a pass already in the wallet, a sport card with no
  // surcharge) cost nothing, so sending a method for them would be meaningless.
  const method = skipsMethodScreen(selection) ? undefined : paymentMethod;
  switch (selection.kind) {
    case "use_pass":
      return { funding_type: "use_pass", user_pass_id: selection.userPassId };
    case "drop_in":
      return { funding_type: "drop_in", payment_method: method };
    case "buy_and_use":
      return { funding_type: "buy_and_use", pass_id: selection.passId, payment_method: method };
    case "sport_card":
      return {
        funding_type: "sport_card",
        studio_sport_card_id: selection.studioSportCardId,
        payment_method: method,
      };
  }
}

/** Sport-card selections with no surcharge skip Method entirely, same as pass-in-wallet (§1). */
export function skipsMethodScreen(selection: FundingSelection): boolean {
  if (selection.kind === "use_pass") return true;
  if (selection.kind === "sport_card") return !selection.fee || selection.fee <= 0;
  return false;
}

/** The 3 funding kinds that can actually reach the Method screen (use_pass always skips it). */
export type MethodFundingSelection = Extract<
  FundingSelection,
  { kind: "drop_in" | "buy_and_use" | "sport_card" }
>;

export function isMethodFundingSelection(
  selection: FundingSelection | null,
): selection is MethodFundingSelection {
  return !!selection && selection.kind !== "use_pass";
}

// `perEntry`/`discountPercent` in pricingHelpers.tsx are typed against the studio-Cennik
// `StudioPass` shape (which carries `id`/`studio_id`); this adapts a booking-options
// `BuyAndUsePassOption` (no `id`/`studio_id`) onto that shape so those functions can be reused
// verbatim rather than reimplemented, per the plan's T01/T03 reuse requirement.
export function buyAndUseAsStudioPass(option: BuyAndUsePassOption): StudioPass {
  return {
    id: option.pass_id,
    studio_id: "",
    name: option.name,
    price: option.price,
    currency: option.currency,
    session_count: option.session_count,
    duration_days: option.duration_days,
  };
}

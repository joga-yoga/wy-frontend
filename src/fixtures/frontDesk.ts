import type {
  FrontDeskSessionsResponse,
  FrontDeskSessionSummary,
  PaidWithoutSeatItem,
  PaymentAttentionResponse,
  ReviewItem,
  RosterEntry,
  WalkInCandidate,
} from "@/app/account/partner/studio/[studioId]/front-desk/types";

import { at, OCC, TEMPLATES, TODAY, USERS } from "./ids";

/**
 * Recepcja for TODAY (Wednesday 2026-09-09).
 *
 * The roster deliberately covers all four `FundingType` values plus the two states the desk
 * actually acts on — `needs_settlement` (money owed or a card to check, no time gate) and
 * `is_overdue` (the same question *plus* the session has started). Those are different questions
 * and a fixture that conflates them lets a prototype conflate them too.
 */
export const todaySessions: FrontDeskSessionSummary[] = [
  {
    occurrence_id: OCC.wedMorning,
    start_time: at(TODAY, "07:00"),
    end_time: at(TODAY, "08:15"),
    template_title: TEMPLATES.hatha.title,
    fill_count: 9,
    capacity: 16,
  },
  {
    occurrence_id: OCC.wedEvening,
    start_time: at(TODAY, "18:00"),
    end_time: at(TODAY, "19:15"),
    template_title: TEMPLATES.vinyasa.title,
    fill_count: 14,
    capacity: 16,
  },
];

export const eveningRoster: RosterEntry[] = [
  {
    booking_id: "bk-marta-wed-eve",
    user_id: USERS.marta.id,
    user_email: USERS.marta.email,
    user_name: USERS.marta.name,
    pass_name: "Karnet 8 wejść",
    pass_entries_total: 8,
    pass_entries_left: 5,
    sport_card_name: null,
    payment_method: null,
    status: "booked",
    funding_type: "use_pass",
    amount_owed: null,
    amount_owed_description: null,
    payment_status: "paid",
    needs_card_check: false,
    checked_in_at: null,
    needs_settlement: false,
    is_overdue: false,
  },
  {
    booking_id: "bk-ola-wed-eve",
    user_id: USERS.ola.id,
    user_email: USERS.ola.email,
    user_name: USERS.ola.name,
    // null entries alongside a pass name = unlimited.
    pass_name: "Karnet open",
    pass_entries_total: null,
    pass_entries_left: null,
    sport_card_name: null,
    payment_method: null,
    status: "booked",
    funding_type: "use_pass",
    amount_owed: null,
    amount_owed_description: null,
    payment_status: "paid",
    needs_card_check: false,
    checked_in_at: at(TODAY, "17:52"),
    needs_settlement: false,
    is_overdue: false,
  },
  {
    booking_id: "bk-piotr-wed-eve",
    user_id: USERS.piotr.id,
    user_email: USERS.piotr.email,
    user_name: USERS.piotr.name,
    pass_name: null,
    pass_entries_total: null,
    pass_entries_left: null,
    sport_card_name: "Karta sportowa",
    payment_method: null,
    status: "booked",
    funding_type: "sport_card",
    amount_owed: null,
    amount_owed_description: null,
    payment_status: null,
    // The card still has to be checked at the desk, so this row needs a person.
    needs_card_check: true,
    checked_in_at: null,
    needs_settlement: true,
    is_overdue: false,
  },
  {
    booking_id: "bk-michal-wed-eve",
    user_id: USERS.michal.id,
    user_email: USERS.michal.email,
    user_name: USERS.michal.name,
    pass_name: null,
    pass_entries_total: null,
    pass_entries_left: null,
    sport_card_name: null,
    payment_method: "cash",
    status: "booked",
    funding_type: "drop_in",
    amount_owed: 45,
    // A CODE crosses the wire; the Polish copy is the frontend's job.
    amount_owed_description: "drop_in",
    payment_status: "unpaid",
    needs_card_check: false,
    checked_in_at: null,
    needs_settlement: true,
    is_overdue: false,
  },
  {
    booking_id: "bk-zofia-wed-eve",
    user_id: USERS.zofia.id,
    user_email: USERS.zofia.email,
    user_name: USERS.zofia.name,
    pass_name: "Karnet 8 wejść",
    pass_entries_total: 8,
    pass_entries_left: 8,
    sport_card_name: null,
    payment_method: "cash",
    status: "booked",
    // Bought a pass and used it in the same visit — the case where the money is collected at the
    // desk on first use, and where Order.booking_id is NULL (see backend CLAUDE.md).
    funding_type: "buy_and_use",
    amount_owed: 320,
    amount_owed_description: "pass",
    payment_status: "unpaid",
    needs_card_check: false,
    checked_in_at: null,
    needs_settlement: true,
    is_overdue: false,
  },
];

/** Money still owed from a session that has already started — the reconciliation pile. */
export const overdue: RosterEntry[] = [
  {
    booking_id: "bk-jakub-mon-eve",
    user_id: USERS.jakub.id,
    user_email: USERS.jakub.email,
    user_name: USERS.jakub.name,
    pass_name: null,
    pass_entries_total: null,
    pass_entries_left: null,
    sport_card_name: null,
    payment_method: "cash",
    status: "attended",
    funding_type: "drop_in",
    amount_owed: 45,
    amount_owed_description: "drop_in",
    payment_status: "unpaid",
    needs_card_check: false,
    checked_in_at: at("2026-09-07", "17:58"),
    needs_settlement: true,
    is_overdue: true,
  },
];

/** The money landed after the seat was already released. Not a RosterEntry — there is no booking. */
export const paidWithoutSeat: PaidWithoutSeatItem[] = [
  {
    order_id: "ord-8841",
    user_id: USERS.zofia.id,
    user_email: USERS.zofia.email,
    user_name: USERS.zofia.name,
    amount_paid: 45,
    currency: "PLN",
    item_type: "drop_in",
    paid_at: at("2026-09-08", "19:12"),
    occurrence_id: OCC.tueEvening,
    occurrence_start_time: at("2026-09-08", "18:30"),
  },
];

/** Something that needs a person: an amount mismatch or a failed refund. */
export const needsReview: ReviewItem[] = [
  {
    id: "rev-104",
    source: "amount_mismatch",
    detail: "Wpłata 40 zł przy należności 45 zł",
    created_at: at("2026-09-08", "20:01"),
    order_id: "ord-8836",
    user_email: USERS.piotr.email,
    user_name: USERS.piotr.name,
    amount: 40,
    currency: "PLN",
    can_retry_refund: false,
  },
  {
    id: "rev-105",
    source: "failed_refund",
    detail: "Zwrot odrzucony przez operatora płatności",
    created_at: at("2026-09-06", "11:44"),
    order_id: "ord-8790",
    user_email: USERS.michal.email,
    user_name: USERS.michal.name,
    amount: 45,
    currency: "PLN",
    can_retry_refund: true,
  },
];

export const frontDeskToday: FrontDeskSessionsResponse = {
  date: TODAY,
  sessions: todaySessions,
  overdue,
  paid_without_seat: paidWithoutSeat,
  needs_review: needsReview,
};

export const paymentAttention: PaymentAttentionResponse = {
  paid_without_seat: paidWithoutSeat,
  needs_review: needsReview,
};

/** Walk-in search results, scoped to this studio's own clients (never other studios' accounts). */
export const walkInCandidates: WalkInCandidate[] = [
  {
    user_id: USERS.marta.id,
    email: USERS.marta.email,
    name: USERS.marta.name,
    pass_context: "Karnet 8 wejść · 5 wejść",
  },
  {
    user_id: USERS.michal.id,
    email: USERS.michal.email,
    name: USERS.michal.name,
    pass_context: null,
  },
];

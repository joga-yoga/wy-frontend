import type {
  ClientDetail,
  ClientListItem,
  ClientPassOut,
  ClientVisit,
  ClientVisitMonth,
  PassWalletOut,
} from "@/app/account/partner/clients/types";

import { at, OCC, PASSES, TEMPLATES, USERS } from "./ids";

/**
 * Six clients spanning every `ChipState`: debt, pass, no_pass, expired, card.
 *
 * The chip is the whole point of this list — it is what tells the front desk who owes money before
 * anyone opens a row — so the fixture covers the full range rather than six comfortable cases.
 */
export const clientList: ClientListItem[] = [
  {
    user_id: USERS.jakub.id,
    email: USERS.jakub.email,
    name: USERS.jakub.name,
    chip: { state: "debt", amount_due: 45, entries_left: null, expired_on: null },
    last_visit: at("2026-09-07", "18:00"),
  },
  {
    user_id: USERS.marta.id,
    email: USERS.marta.email,
    name: USERS.marta.name,
    chip: { state: "pass", amount_due: null, entries_left: 5, expired_on: null },
    last_visit: at("2026-09-07", "07:00"),
  },
  {
    user_id: USERS.ola.id,
    email: USERS.ola.email,
    name: USERS.ola.name,
    chip: { state: "pass", amount_due: null, entries_left: null, expired_on: null },
    last_visit: at("2026-09-08", "18:30"),
  },
  {
    user_id: USERS.piotr.id,
    email: USERS.piotr.email,
    name: USERS.piotr.name,
    chip: { state: "card", amount_due: null, entries_left: null, expired_on: null },
    last_visit: at("2026-09-07", "18:00"),
  },
  {
    user_id: USERS.zofia.id,
    email: USERS.zofia.email,
    name: USERS.zofia.name,
    chip: { state: "expired", amount_due: null, entries_left: 0, expired_on: "2026-08-31" },
    last_visit: at("2026-08-26", "18:30"),
  },
  {
    // Name deliberately null: the backend allows it, and a list that never renders the
    // fallback is a list whose fallback has never been designed.
    user_id: USERS.michal.id,
    email: USERS.michal.email,
    name: USERS.michal.name,
    chip: { state: "no_pass", amount_due: null, entries_left: null, expired_on: null },
    last_visit: null,
  },
];

/** Marta's active carnet — the same pass row her own B2C wallet shows (see b2c.ts). */
export const martaWallet: PassWalletOut = {
  state: "active",
  pass_name: "Karnet 8 wejść",
  entries_total: 8,
  entries_left: 5,
  valid_until: "2026-10-15",
  purchased_at: at("2026-08-15", "17:42"),
  price: 320,
  currency: "PLN",
  duration_days: 60,
  is_paid: true,
};

/** Every `WalletState`, so pass-history prototypes face the full range. */
export const clientPasses: ClientPassOut[] = [
  { id: PASSES.martaCarnet8, ...martaWallet },
  {
    id: PASSES.martaSpent,
    state: "used",
    pass_name: "Karnet 4 wejścia",
    entries_total: 4,
    entries_left: 0,
    valid_until: "2026-08-10",
    purchased_at: at("2026-06-12", "11:05"),
    price: 180,
    currency: "PLN",
    duration_days: 60,
    is_paid: true,
  },
  {
    id: PASSES.jakubExpired,
    state: "expired",
    pass_name: "Karnet 8 wejść",
    entries_total: 8,
    entries_left: 3,
    valid_until: "2026-08-31",
    purchased_at: at("2026-07-01", "19:20"),
    price: 320,
    currency: "PLN",
    duration_days: 60,
    // Collected at the desk and never settled — this is what drives Jakub's debt chip.
    is_paid: false,
  },
  {
    id: PASSES.olaUnlimited,
    state: "active",
    // null entries alongside a name means unlimited — the case a naive "n wejść" label breaks on.
    pass_name: "Karnet open",
    entries_total: null,
    entries_left: null,
    valid_until: "2026-11-30",
    purchased_at: at("2026-09-01", "08:30"),
    price: 450,
    currency: "PLN",
    duration_days: 90,
    is_paid: true,
  },
  {
    id: PASSES.zofiaCancelled,
    state: "cancelled",
    pass_name: "Karnet 8 wejść",
    entries_total: 8,
    entries_left: 6,
    valid_until: "2026-09-30",
    purchased_at: at("2026-08-02", "16:10"),
    price: 320,
    currency: "PLN",
    duration_days: 60,
    is_paid: true,
  },
];

export const martaVisits: ClientVisit[] = [
  {
    booking_id: "bk-marta-wed",
    occurrence_id: OCC.wedMorning,
    start_time: at("2026-09-09", "07:00"),
    class_title: TEMPLATES.hatha.title,
    status: "booked",
    funding: "use_pass",
  },
  {
    booking_id: "bk-marta-mon",
    occurrence_id: OCC.monMorning,
    start_time: at("2026-09-07", "07:00"),
    class_title: TEMPLATES.hatha.title,
    status: "attended",
    funding: "use_pass",
  },
  {
    booking_id: "bk-marta-aug-2",
    occurrence_id: null,
    start_time: at("2026-08-28", "18:00"),
    class_title: TEMPLATES.vinyasa.title,
    // A returned entry. Kept and marked rather than hidden: it is part of the story of where the
    // pass went, and hiding it makes the remaining count look wrong to anyone counting rows.
    status: "cancelled",
    funding: "use_pass",
  },
];

export const martaVisitMonths: ClientVisitMonth[] = [
  { month: "2026-09", visits: martaVisits.slice(0, 2) },
  { month: "2026-08", visits: martaVisits.slice(2) },
];

export const martaDetail: ClientDetail = {
  user_id: USERS.marta.id,
  email: USERS.marta.email,
  name: USERS.marta.name,
  client_since: "2025-01-20",
  chip: { state: "pass", amount_due: null, entries_left: 5, expired_on: null },
  wallet: martaWallet,
  visit_count: 27,
  recent_visits: martaVisits,
};

/** The client who owes money — the row every reconciliation prototype needs. */
export const jakubDetail: ClientDetail = {
  user_id: USERS.jakub.id,
  email: USERS.jakub.email,
  name: USERS.jakub.name,
  client_since: "2026-06-30",
  chip: { state: "debt", amount_due: 45, entries_left: null, expired_on: null },
  wallet: null,
  visit_count: 9,
  recent_visits: [
    {
      booking_id: "bk-jakub-mon",
      occurrence_id: OCC.monEvening,
      start_time: at("2026-09-07", "18:00"),
      class_title: TEMPLATES.vinyasa.title,
      status: "attended",
      funding: "drop_in",
    },
  ],
};

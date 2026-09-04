import type {
  MyBookingItem,
  MyBookingsResponse,
  MyInquiryItem,
  MyPassDetailOut,
  MyPassUsageEntry,
  MyPassWalletOut,
} from "@/app/account/types";

import { at, OCC, PASSES, STUDIO, TEMPLATES, USERS } from "./ids";

/**
 * The B2C persona: Marta Zielińska (`u-marta`), who is also row 2 of the studio's client list.
 *
 * Every id here points back into the B2B world — her bookings are the partner's occurrences, her
 * pass is the same row `clients.ts` exposes as `martaWallet`. That is what makes a B2C prototype
 * and a B2B prototype of the same moment comparable instead of merely similar.
 */
export const myBookings: MyBookingItem[] = [
  {
    booking_id: "bk-marta-wed",
    occurrence_id: OCC.wedMorning,
    event_title: TEMPLATES.hatha.title,
    event_type: "class",
    studio_name: STUDIO.name,
    start_time: at("2026-09-09", "07:00"),
    status: "booked",
    funding: "use_pass",
    is_past: false,
    // Class-palette key, so her reservation card draws the same colour the partner's Grafik does.
    color: "green",
    duration_minutes: 75,
  },
  {
    booking_id: "bk-marta-fri",
    occurrence_id: OCC.friMorning,
    event_title: TEMPLATES.hatha.title,
    event_type: "class",
    studio_name: STUDIO.name,
    start_time: at("2026-09-11", "07:00"),
    status: "booked",
    funding: "use_pass",
    is_past: false,
    color: "green",
    duration_minutes: 75,
  },
  {
    booking_id: "bk-marta-mon",
    occurrence_id: OCC.monMorning,
    event_title: TEMPLATES.hatha.title,
    event_type: "class",
    studio_name: STUDIO.name,
    start_time: at("2026-09-07", "07:00"),
    status: "attended",
    funding: "use_pass",
    is_past: true,
    color: "green",
    duration_minutes: 75,
  },
  {
    // A retreat: no occurrence, no colour, a different event type. The card that assumes every
    // booking is a class breaks here, which is the point of including it.
    booking_id: "bk-marta-retreat",
    occurrence_id: null,
    event_title: "Wyjazd jogowy w Karkonosze",
    event_type: "retreat",
    studio_name: STUDIO.name,
    start_time: at("2026-10-16", "16:00"),
    status: "booked",
    funding: "drop_in",
    is_past: false,
    color: null,
    duration_minutes: null,
  },
];

export const myInquiries: MyInquiryItem[] = [
  {
    id: "inq-233",
    kind: "retreat",
    status: "open",
    event_title: "Wyjazd jogowy w Bieszczady",
    event_type: "retreat",
    created_at: at("2026-09-02", "21:14"),
    is_past: false,
  },
];

export const myBookingsResponse: MyBookingsResponse = {
  bookings: myBookings,
  inquiries: myInquiries,
  upcoming_count: myBookings.filter((b) => !b.is_past).length,
  inquiry_count: myInquiries.filter((i) => i.status === "open").length,
};

/**
 * Two passes at the SAME studio — the case `GET /users/me/passes` was changed to make visible.
 * A wallet keyed on `studio_id` collapses these into one row and loses the spent carnet.
 */
export const myPasses: MyPassWalletOut[] = [
  {
    id: PASSES.martaCarnet8,
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
    studio_id: STUDIO.id,
    studio_name: STUDIO.name,
  },
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
    studio_id: STUDIO.id,
    studio_name: STUDIO.name,
  },
];

const carnetUsage: MyPassUsageEntry[] = [
  {
    booking_id: "bk-marta-wed",
    status: "booked",
    session_title: TEMPLATES.hatha.title,
    studio_name: STUDIO.name,
    starts_at: at("2026-09-09", "07:00"),
  },
  {
    booking_id: "bk-marta-mon",
    status: "attended",
    session_title: TEMPLATES.hatha.title,
    studio_name: STUDIO.name,
    starts_at: at("2026-09-07", "07:00"),
  },
  {
    // A returned entry, included and marked — hiding it makes the remaining count look wrong to
    // anyone counting rows.
    booking_id: "bk-marta-aug-2",
    status: "cancelled",
    session_title: TEMPLATES.vinyasa.title,
    studio_name: STUDIO.name,
    starts_at: at("2026-08-28", "18:00"),
  },
];

export const myPassDetail: MyPassDetailOut = {
  ...myPasses[0],
  usage: carnetUsage,
};

export const b2cPersona = {
  user: USERS.marta,
  bookings: myBookingsResponse,
  passes: myPasses,
  passDetail: myPassDetail,
} as const;

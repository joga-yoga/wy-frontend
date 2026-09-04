import type {
  StudioRosterItem,
  StudioRosterResponse,
} from "@/app/account/partner/instructors/types";

import { INSTRUCTORS } from "./ids";

/**
 * The studio's instructor roster, covering four of the five `RosterRowState` values.
 *
 * `rejected` is deliberately absent: it is a real state but a rare one, and a roster fixture that
 * shows every state at once stops looking like a roster and starts looking like a state table.
 * Add it in a prototype that is specifically about rejection.
 */
export const rosterItems: StudioRosterItem[] = [
  {
    id: INSTRUCTORS.owner.id,
    name: INSTRUCTORS.owner.name,
    image_id: null,
    short_bio: "Uważna praktyka jogi dla ciała, oddechu i spokoju umysłu.",
    slug: "przemek-nadolny",
    email: "przemek@bodhi.example.com",
    claim_status: "claimed",
    link_status: "active",
    initiated_by: "studio",
    row_state: "self",
    is_owned: true,
    can_edit_profile: true,
    added_at: "2024-11-04T09:00:00+01:00",
    invited_at: null,
  },
  {
    id: INSTRUCTORS.linked.id,
    name: INSTRUCTORS.linked.name,
    image_id: null,
    short_bio: "Vinyasa w spokojnym tempie, z naciskiem na oddech.",
    slug: "marta-zielinska",
    email: "marta.zielinska@example.com",
    claim_status: "claimed",
    link_status: "active",
    initiated_by: "instructor",
    row_state: "linked",
    is_owned: false,
    can_edit_profile: false,
    added_at: "2025-02-17T10:30:00+01:00",
    invited_at: null,
  },
  {
    id: INSTRUCTORS.awaiting.id,
    name: INSTRUCTORS.awaiting.name,
    image_id: null,
    short_bio: null,
    slug: null,
    email: "katarzyna.wroniecka@example.com",
    claim_status: "invited",
    link_status: "pending",
    initiated_by: "studio",
    row_state: "awaiting",
    is_owned: false,
    can_edit_profile: false,
    added_at: "2026-08-28T14:05:00+02:00",
    invited_at: "2026-08-28T14:05:00+02:00",
  },
  {
    id: INSTRUCTORS.noAccount.id,
    name: INSTRUCTORS.noAccount.name,
    image_id: null,
    short_bio: "Ashtanga w tradycji Mysore.",
    slug: null,
    email: null,
    claim_status: "invitable",
    link_status: "active",
    initiated_by: "studio",
    row_state: "no_account",
    is_owned: true,
    can_edit_profile: true,
    added_at: "2025-06-02T08:15:00+02:00",
    invited_at: null,
  },
];

export const rosterResponse: StudioRosterResponse = {
  items: rosterItems,
  total: rosterItems.length,
  awaiting_count: rosterItems.filter((i) => i.row_state === "awaiting").length,
};

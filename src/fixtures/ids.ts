/**
 * Stable identifiers for the fixture world.
 *
 * Centralised so cross-references are checkable at a glance: if the B2C persona's booking points
 * at OCC.wedMorning, it is provably the same session the partner's Grafik and the front desk are
 * showing. Ids are readable rather than UUID-shaped on purpose — a fixture whose ids are opaque
 * makes an inconsistency invisible in a screenshot.
 */

/** Everything in the fixture world is anchored to this date. A Wednesday. */
export const TODAY = "2026-09-09";

export const WEEK_START = "2026-09-07"; // Monday
export const WEEK_END = "2026-09-13"; // Sunday

export const STUDIO = {
  id: "st-bodhi",
  name: "Bodhi Yoga Shala",
} as const;

export const ROOMS = {
  main: { id: "room-main", name: "Sala główna" },
  small: { id: "room-small", name: "Sala mała" },
} as const;

export const INSTRUCTORS = {
  owner: { id: "in-przemek", name: "Przemek Nadolny" },
  linked: { id: "in-marta", name: "Marta Zielińska" },
  awaiting: { id: "in-kasia", name: "Katarzyna Wroniecka" },
  noAccount: { id: "in-tomek", name: "Tomasz Sowa" },
} as const;

export const TEMPLATES = {
  hatha: { id: "tpl-hatha", title: "Hatha Joga" },
  vinyasa: { id: "tpl-vinyasa", title: "Vinyasa Flow" },
  beginners: { id: "tpl-beginners", title: "Joga dla początkujących" },
  nidra: { id: "tpl-nidra", title: "Joga Nidra" },
  mysore: { id: "tpl-mysore", title: "Ashtanga Mysore" },
} as const;

export const OCC = {
  monMorning: "occ-mon-0700",
  monEvening: "occ-mon-1800",
  tueEvening: "occ-tue-1830",
  wedMorning: "occ-wed-0700",
  wedEvening: "occ-wed-1800",
  thuEvening: "occ-thu-1830",
  friMorning: "occ-fri-0700",
  satMidday: "occ-sat-1000",
} as const;

export const USERS = {
  marta: { id: "u-marta", email: "marta.zielinska@example.com", name: "Marta Zielińska" },
  jakub: { id: "u-jakub", email: "jakub.wojcik@example.com", name: "Jakub Wójcik" },
  ola: { id: "u-ola", email: "aleksandra.krol@example.com", name: "Aleksandra Król" },
  piotr: { id: "u-piotr", email: "piotr.lewandowski@example.com", name: "Piotr Lewandowski" },
  zofia: { id: "u-zofia", email: "zofia.baranowska@example.com", name: "Zofia Baranowska" },
  michal: { id: "u-michal", email: "michal.adamczyk@example.com", name: null },
} as const;

export const PASSES = {
  martaCarnet8: "up-marta-8",
  jakubExpired: "up-jakub-expired",
  olaUnlimited: "up-ola-unlimited",
  zofiaCancelled: "up-zofia-cancelled",
  martaSpent: "up-marta-spent",
} as const;

/** Helper for building the fixed ISO timestamps every module shares. */
export function at(date: string, time: string): string {
  return `${date}T${time}:00+02:00`;
}

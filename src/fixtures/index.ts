/**
 * Deterministic persona fixtures — see README.md in this directory.
 *
 * Two personas, one world:
 *   B2B  Bodhi Yoga Shala, its roster, clients, week of sessions and front desk
 *   B2C  Marta Zielińska, who is also one of that studio's clients
 *
 * Every export is typed against a real product type, so an invented field is a compile error.
 */
export * from "./b2c";
export * from "./clients";
export * from "./frontDesk";
export * from "./ids";
export * from "./instructor";
export * from "./roster";
export * from "./schedule";
export * from "./studio";

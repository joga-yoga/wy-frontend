import type { RosterRowState } from "./types";

/**
 * The roster chip vocabulary, in one place.
 *
 * Shared by the list and by `InstructorConnectionSheet`, which used to hardcode a green
 * "Połączono" of its own. That is how a row could read amber "Oczekuje" in the list and
 * green "Połączono" the moment you opened it — two renderings of one fact, and one of
 * them was a guess.
 */
export const CHIP: Record<RosterRowState, { label: string; tone: "green" | "amber" | "gray" }> = {
  self: { label: "To Ty", tone: "gray" },
  linked: { label: "Połączono", tone: "green" },
  awaiting: { label: "Oczekuje", tone: "amber" },
  no_account: { label: "Bez konta", tone: "gray" },
};

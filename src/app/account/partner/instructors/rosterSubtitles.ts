import type { StudioRosterItem } from "./types";

/**
 * The roster subtitle vocabulary, beside `rosterChips.ts` and for the same reason: this
 * logic is a small state machine over two independent lifecycles, and it was wrong while
 * it lived inline in the page with nothing able to exercise it.
 */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export function subtitleFor(item: StudioRosterItem): { text: string; amber: boolean } {
  switch (item.row_state) {
    case "self":
      return { text: "Twój profil instruktora", amber: false };
    case "linked":
      return { text: "Zarządza swoim profilem", amber: false };
    case "awaiting":
      // R2 puts the invite date here rather than the edit-rights fact — "when did we ask
      // them?" is the question a pending row actually raises.
      //
      // ⚠ **Three different situations reach `awaiting`** and only one of them is a
      // profile this studio manages. The subtitle used to assume the stub case and fall
      // back to "Profil w Twoim zarządzaniu" whenever `invited_at` was null — which is
      // how a row could say the studio manages a profile while the sheet it opens says
      // the opposite. `invited_at` tracks the claim `Invitation`, and the two cases below
      // have none, so it is null for both.

      // 1. The profile is already someone's (WY-63 case 5). We are waiting on *them* to
      //    accept joining the crew; the studio manages nothing. The roster invitation went
      //    out when the link was created, so `added_at` is its date.
      if (item.claim_status === "claimed") {
        return { text: `Zaproszenie do zespołu wysłane ${shortDate(item.added_at)}`, amber: false };
      }

      // 2. An unclaimed stub, but another account created and owns it — same sentence the
      //    connection sheet shows, so the two cannot disagree again.
      if (!item.can_edit_profile) {
        return { text: "Profil prowadzi inne konto", amber: false };
      }

      // 3. A stub this studio created and invited. Only here is the profile genuinely
      //    in the studio's management.
      return {
        text: item.invited_at
          ? `Zaproszenie wysłane ${shortDate(item.invited_at)}`
          : "Profil w Twoim zarządzaniu",
        amber: false,
      };
    case "no_account":
      return { text: "Zaproszenie niewysłane — dodaj email", amber: true };
    case "rejected":
      // Says what happened without editorialising. The row is still here and still
      // re-invitable, which is the difference between this and having been detached.
      return { text: "Zaproszenie odrzucone", amber: false };
  }
}

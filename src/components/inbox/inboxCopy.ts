import type { InboxItem, InboxState } from "./types";

/**
 * Every sentence the inbox shows, in one place.
 *
 * Copy is built from facts on the item, never from a stored string — the same rule the
 * backend's renderers follow. All forms are gender-neutral: the payload carries no gender
 * and guessing from a name misgenders real people.
 */

export const STATE_LABEL: Record<InboxState, string> = {
  pending: "Oczekuje",
  accepted: "Zaakceptowano",
  rejected: "Odrzucono",
  expired: "Wygasło",
  info: "Informacja",
};

/** One line naming both parties. `target_name` matters: an account can hold several studios. */
export function summarize(item: InboxItem): string {
  const actor = item.actor_name ?? item.title ?? "Ktoś";
  const target = item.target_name;
  switch (item.kind) {
    case "roster_request":
      return target
        ? `${actor} — prośba o dołączenie do ${target}`
        : `${actor} — prośba o dołączenie`;
    case "roster_invite":
      return `${actor} zaprasza do zespołu`;
    case "credit_invite":
      return item.title ? `Współorganizacja: ${item.title}` : "Zaproszenie do współorganizacji";
    case "claim":
      return item.title ? `Przejmij profil: ${item.title}` : "Zaproszenie do przejęcia profilu";
    case "grant_received":
      return item.title ? `Nadano dostęp: ${item.title}` : "Nadano dostęp";
  }
}

export function describe(item: InboxItem): string {
  const actor = item.actor_name ?? item.title ?? "Ktoś";
  const target = item.target_name ?? "Twój profil";
  switch (item.kind) {
    case "roster_request":
      return `${actor} prowadzi zajęcia w ${target} i prosi o dodanie do zespołu. Po akceptacji ta osoba pojawi się na publicznej stronie studia i w grafiku.`;
    case "roster_invite":
      return `${actor} chce dodać profil ${target} do swojego zespołu. Po akceptacji studio pojawi się na Twoim profilu publicznym.`;
    case "credit_invite":
      return `Zaproszenie do współorganizacji wydarzenia${item.title ? `: ${item.title}` : ""}.`;
    case "claim":
      return `Zaproszenie do przejęcia profilu${item.title ? `: ${item.title}` : ""}. Po przejęciu zarządzasz nim samodzielnie.`;
    case "grant_received":
      // Announcements have nothing to accept — a grant takes effect when it is written.
      return `Otrzymano dostęp${item.title ? ` do: ${item.title}` : ""}${item.subtitle ? ` (rola: ${item.subtitle})` : ""}.`;
  }
}

/** Accept/reject endpoints per kind, or `null` for an announcement. */
export function actionUrls(item: InboxItem): { accept: string; reject: string } | null {
  switch (item.kind) {
    case "claim":
      return {
        accept: `/users/me/invitations/${item.id}/accept`,
        reject: `/users/me/invitations/${item.id}/decline`,
      };
    case "credit_invite":
      return {
        accept: `/events/${item.resource_id}/organizers/${item.id}/accept`,
        reject: `/events/${item.resource_id}/organizers/${item.id}/decline`,
      };
    case "roster_request":
      // The reader is the studio (`target_id`); `id` is the instructor asking.
      return {
        accept: `/studios/${item.target_id}/roster/${item.id}/accept`,
        reject: `/studios/${item.target_id}/roster/${item.id}/reject`,
      };
    case "roster_invite":
      // Mirror: the reader owns the instructor profile (`target_id`); `id` is the studio.
      return {
        accept: `/studios/${item.id}/roster/${item.target_id}/accept`,
        reject: `/studios/${item.id}/roster/${item.target_id}/reject`,
      };
    case "grant_received":
      return null;
  }
}

export function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "dziś";
  if (days === 1) return "wczoraj";
  if (days < 7) return `${days} dni temu`;
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

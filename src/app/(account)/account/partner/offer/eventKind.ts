import { GraduationCap, Mountain, Sparkles, Tag } from "lucide-react";

import type { DashboardItem } from "./offerConfig";

/**
 * Per-type identity for the Oferta list.
 *
 * The list used to be split into four titled sections, so the heading told you what a row
 * was. It is one list now — which means the row itself has to say it, in two places at
 * once: a coloured tile behind the thumbnail (visible when an event has no photo) and a
 * badge that is always there.
 *
 * Colours are the design HTML's per-type palette (`--c-teal`, `--c-sand`, `--c-lav`,
 * `--c-green` with their `-t` tints and `-x` texts), which is the same palette the class
 * colours already use.
 */
export const EVENT_KIND = {
  retreat: {
    label: "Wyjazd",
    Icon: Mountain,
    tile: "bg-class-teal-500/15 text-class-teal-700",
    badge: "bg-class-teal-500/15 text-class-teal-700",
  },
  workshop: {
    label: "Wydarzenie",
    Icon: Sparkles,
    tile: "bg-class-sand-500/25 text-class-sand-700",
    badge: "bg-class-sand-500/25 text-class-sand-700",
  },
  course: {
    label: "Kurs",
    Icon: GraduationCap,
    tile: "bg-class-lavender-500/20 text-class-lavender-700",
    badge: "bg-class-lavender-500/20 text-class-lavender-700",
  },
  class: {
    label: "Zajęcia",
    Icon: Tag,
    tile: "bg-class-green-500/15 text-class-green-700",
    badge: "bg-class-green-500/15 text-class-green-700",
  },
} as const satisfies Record<DashboardItem["kind"], unknown>;

export function isPastEvent(event: DashboardItem, now = new Date()): boolean {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  // An event with no end date has not "passed" — a recurring class or an undated draft
  // sinking into the archive would be a bug, not tidiness.
  const end = event.end_date ?? event.start_date;
  if (!end) return false;
  return new Date(end) < today;
}

/**
 * Best-in-front ordering, replacing four `.slice(0, 2)` sections.
 *
 * 1. **Drafts first.** An unpublished event is the only kind that needs an action from
 *    the partner; everything else is just running.
 * 2. **Then upcoming, soonest first** — the next thing to happen is the thing you are
 *    most likely to be looking for.
 * 3. **Undated last within the live group**, since they cannot be sequenced.
 *
 * Past events are not sorted here at all; they are split out into the archive.
 */
export function sortForOffer(items: DashboardItem[]): DashboardItem[] {
  const rank = (e: DashboardItem) => (e.is_public ? 1 : 0);
  const startOf = (e: DashboardItem) =>
    e.start_date ? new Date(e.start_date).getTime() : Number.POSITIVE_INFINITY;

  return [...items].sort((a, b) => rank(a) - rank(b) || startOf(a) - startOf(b));
}

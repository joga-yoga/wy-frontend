import { StatusChip } from "@/components/b2b/StatusChip";

import type { Mode, Outcome, Status } from "./meta";

/**
 * §4/§5: a non-`system` prototype must be visually distinct wherever it appears, "so an
 * unadopted exploration is never mistaken for current system truth". Reuses the product's own
 * chip so the shell looks like the system it indexes.
 */
export function ModeBadge({ mode }: { mode: Mode }) {
  if (mode === "system") return <StatusChip tone="gray">system</StatusChip>;
  return <StatusChip tone="amber">{mode}</StatusChip>;
}

const STATUS_TONE = {
  explored: "gray",
  locked: "green",
  shipped: "green",
  rejected: "rose",
} as const satisfies Record<Status, "gray" | "green" | "rose" | "amber">;

export function StatusBadge({ status }: { status: Status }) {
  return <StatusChip tone={STATUS_TONE[status]}>{status}</StatusChip>;
}

const OUTCOME_TONE = {
  rejected: "rose",
  scoped: "amber",
  promoted: "green",
} as const satisfies Record<Outcome, "gray" | "green" | "rose" | "amber">;

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <StatusChip tone={OUTCOME_TONE[outcome]}>{outcome}</StatusChip>;
}

/**
 * §4: "Unresolved forks are the way a design system rots; the index's job is to make them
 * visible." Loud on purpose — a subtle tint would defeat the entire point of the field.
 */
export function UnresolvedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-b2b-red-solid px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white">
      unresolved
    </span>
  );
}

/** §4: flagged, never blocked — the shell does not enforce that a control exists. */
export function NoControlBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-b2b-amber-border bg-b2b-amber-bg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-b2b-amber-text">
      no control variant
    </span>
  );
}

export function IssuesBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-b2b-red-border bg-b2b-red-bg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-b2b-red-text">
      {count} {count === 1 ? "issue" : "issues"}
    </span>
  );
}

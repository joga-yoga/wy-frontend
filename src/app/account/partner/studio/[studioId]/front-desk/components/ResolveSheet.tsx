"use client";

import { useEffect, useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { formatMoney } from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { personInitials, personLabel } from "@/lib/personDisplay";

import { fundingDetailLine } from "../fundingDetail";
import { isPendingEntry } from "../rosterGrouping";
import type { RosterEntry } from "../types";

/**
 * Per-person sheet (spec §5.2), opened by tapping a row's body rather than its primary button.
 * `RosterRow` also exposes the same resolution as its own `Potwierdź` button plus the confirm/
 * undo pair (spec §5.1/§6) — that's the fast path for the common case. This sheet repeats
 * `Potwierdź` for callers with no row of their own to put a button on (the reconciliation list
 * opens this exact sheet — see its docstring), and is otherwise for the secondary, less-frequent
 * outcomes: marking someone absent, removing the booking outright, and (for an already-absent
 * row) correcting that back via `correct-no-show`, with no time limit (Decision 3).
 *
 * "Zmień sposób płatności" is in the spec's copy table but has no backend path yet — scoped out
 * of this task per T03's explicit instruction rather than half-built (see plan Execution Summary).
 */
export function ResolveSheet({
  entry,
  open,
  onOpenChange,
  onConfirm,
  onMarkNoShow,
  onCorrectNoShow,
  onDeskCancel,
}: {
  entry: RosterEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  onMarkNoShow: () => Promise<void>;
  onCorrectNoShow: () => Promise<void>;
  onDeskCancel: () => Promise<void>;
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Both callers derive `open` from `entry != null` and null the entry out the instant
  // they close the sheet — so `entry` would go null on the very same render as `open`
  // going false. Unmounting `<Drawer>` on `!entry` (the previous approach) meant it never
  // had a prior "open" paint to transition *from*, so it just appeared/disappeared
  // instantly. Keeping the last non-null entry around lets `<Drawer>` stay mounted and
  // animate its own close, the same way the Front Desk add-user drawer already does.
  const [lastEntry, setLastEntry] = useState<RosterEntry | null>(entry);
  useEffect(() => {
    if (entry) setLastEntry(entry);
  }, [entry]);
  const displayEntry = entry ?? lastEntry;

  if (!displayEntry) {
    return <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle />;
  }

  const isNoShow = displayEntry.status === "no_show";
  const isPending = isPendingEntry(displayEntry);
  const amount = displayEntry.amount_owed;
  const label = personLabel(displayEntry.user_name, displayEntry.user_email);
  const detail = fundingDetailLine(displayEntry);
  const owesMoney =
    (displayEntry.needs_settlement ?? displayEntry.is_overdue) && !displayEntry.needs_card_check;

  async function run(key: string, action: () => Promise<void>) {
    setBusyKey(key);
    try {
      await action();
      onOpenChange(false);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="sm:mx-auto sm:max-w-md">
        {/* T5-v2 header: avatar, name, and the state chip on the right. */}
        <div className="flex items-start gap-3 px-4 pt-2 pb-4">
          <HashedAvatar
            seed={displayEntry.user_id}
            name={label.primary}
            initialsOverride={personInitials(displayEntry.user_name, displayEntry.user_email)}
            size={44}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <DrawerTitle className="min-w-0 flex-1 truncate text-base font-bold text-gray-900">
                {label.primary}
              </DrawerTitle>
              {isNoShow ? (
                <StatusChip tone="gray">Nieobecność</StatusChip>
              ) : displayEntry.needs_card_check ? (
                <StatusChip tone="amber">Sprawdź kartę</StatusChip>
              ) : owesMoney ? (
                <StatusChip tone="amber">Do zapłaty</StatusChip>
              ) : displayEntry.checked_in_at != null ? (
                <StatusChip tone="green">Obecność ✓</StatusChip>
              ) : (
                <StatusChip tone="gray">Oczekuje</StatusChip>
              )}
            </div>
            {/* The amount is the fact the desk is acting on, so it carries the weight. */}
            <p className="mt-0.5 text-xs text-gray-500">
              {detail}
              {amount != null && owesMoney && (
                <>
                  {detail ? " · do zapłaty " : "do zapłaty "}
                  <span className="font-semibold text-gray-900">{formatMoney(amount)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2 px-4 pb-6">
          {isPending && (
            <Button
              size="action"
              variant="green"
              className="w-full"
              onClick={() => run("confirm", onConfirm)}
              disabled={busyKey !== null}
            >
              {amount != null ? `Potwierdź · ${formatMoney(amount)}` : "Potwierdź"}
            </Button>
          )}

          {isNoShow ? (
            <Button
              size="action"
              variant="green"
              className="w-full"
              onClick={() => run("correct", onCorrectNoShow)}
              disabled={busyKey !== null}
            >
              Cofnij nieobecność
            </Button>
          ) : (
            // Outline, not solid: marking someone absent is a normal outcome, not a warning.
            <Button
              size="action"
              variant="outline"
              className="w-full border-b2b-red-border text-b2b-red-solid hover:bg-b2b-red-bg hover:text-b2b-red-solid"
              onClick={() => run("no_show", onMarkNoShow)}
              disabled={busyKey !== null}
            >
              Oznacz nieobecność
            </Button>
          )}

          <Button
            size="action"
            variant="outline"
            className="w-full"
            onClick={() => run("cancel", onDeskCancel)}
            disabled={busyKey !== null}
          >
            Usuń rezerwację
          </Button>

          <p className="px-1 pt-1 text-xs text-gray-400">
            {isNoShow
              ? "Cofnij nieobecność: rezerwacja wraca jako opłacona / obecna."
              : "Nieobecność: rezerwacja oznaczona, płatność anulowana. Los wejścia z karnetu wynika z polityki odwołań studia."}
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

"use client";

import { useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
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

  if (!entry) return null;

  const isNoShow = entry.status === "no_show";
  const isPending = isPendingEntry(entry);
  const amount = entry.amount_owed;
  const label = personLabel(entry.user_name, entry.user_email);
  const detail = fundingDetailLine(entry);
  const owesMoney = (entry.needs_settlement ?? entry.is_overdue) && !entry.needs_card_check;

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
            seed={entry.user_id}
            name={label.primary}
            initialsOverride={personInitials(entry.user_name, entry.user_email)}
            size={44}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <DrawerTitle className="min-w-0 flex-1 truncate text-base font-bold text-gray-900">
                {label.primary}
              </DrawerTitle>
              {isNoShow ? (
                <StatusChip tone="gray">Nieobecność</StatusChip>
              ) : entry.needs_card_check ? (
                <StatusChip tone="amber">Sprawdź kartę</StatusChip>
              ) : owesMoney ? (
                <StatusChip tone="amber">Do zapłaty</StatusChip>
              ) : entry.checked_in_at != null ? (
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
                  <span className="font-semibold text-gray-900">{amount} zł</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2 px-4 pb-6">
          {isPending && (
            <button
              onClick={() => run("confirm", onConfirm)}
              disabled={busyKey !== null}
              className="w-full rounded-xl bg-b2b-green-text px-4 py-3.5 text-center text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {amount != null ? `Potwierdź · ${amount} zł` : "Potwierdź"}
            </button>
          )}

          {isNoShow ? (
            <button
              onClick={() => run("correct", onCorrectNoShow)}
              disabled={busyKey !== null}
              className="w-full rounded-xl bg-b2b-green-text px-4 py-3.5 text-center text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              Cofnij nieobecność
            </button>
          ) : (
            // Outline, not solid: marking someone absent is a normal outcome, not a warning.
            <button
              onClick={() => run("no_show", onMarkNoShow)}
              disabled={busyKey !== null}
              className="w-full rounded-b2b border border-b2b-red-border bg-white px-4 py-3.5 text-center text-sm font-medium text-b2b-red-solid hover:bg-b2b-red-bg disabled:opacity-60"
            >
              Nieobecność
            </button>
          )}

          <button
            onClick={() => run("cancel", onDeskCancel)}
            disabled={busyKey !== null}
            className="w-full rounded-b2b border bg-white px-4 py-3.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            Usuń rezerwację
          </button>

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

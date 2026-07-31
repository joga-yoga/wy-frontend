"use client";

import { useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { personInitials, personLabel } from "@/lib/personDisplay";

import { fundingDetailLine } from "../fundingDetail";
import type { RosterEntry } from "../types";

/**
 * The one resolve sheet (reception-desk §3) — every outcome for a row lives here,
 * never as extra list buttons. Reused unchanged by the reconciliation list, which
 * opens the same sheet for the same booking rather than forking a second flow.
 */
export function ResolveSheet({
  entry,
  open,
  onOpenChange,
  onMarkPaid,
  onMarkCardOk,
  onMarkAttended,
  onMarkNoShow,
}: {
  entry: RosterEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkPaid: () => Promise<void>;
  onMarkCardOk: () => Promise<void>;
  onMarkAttended: () => Promise<void>;
  onMarkNoShow: () => Promise<void>;
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (!entry) return null;

  const isCard = entry.funding_type === "sport_card";
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
            {personInitials(entry.user_name, entry.user_email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <DrawerTitle className="min-w-0 flex-1 truncate text-base font-bold text-gray-900">
                {label.primary}
              </DrawerTitle>
              {entry.status === "no_show" ? (
                <StatusChip tone="gray">Nieobecność</StatusChip>
              ) : entry.needs_card_check ? (
                <StatusChip tone="amber">Sprawdź kartę</StatusChip>
              ) : owesMoney ? (
                <StatusChip tone="amber">Do zapłaty</StatusChip>
              ) : (
                <StatusChip tone="green">Obecność ✓</StatusChip>
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
          {isCard ? (
            <button
              onClick={() => run("card", onMarkCardOk)}
              disabled={busyKey !== null}
              className="w-full rounded-xl bg-b2b-green-text px-4 py-3.5 text-center text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              Karta OK · obecność ✓{amount != null ? ` (+${amount} zł dopłata)` : ""}
            </button>
          ) : (
            <button
              onClick={() => run("paid", onMarkPaid)}
              disabled={busyKey !== null}
              className="w-full rounded-xl bg-b2b-green-text px-4 py-3.5 text-center text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              Zapłacono{amount != null ? ` ${amount} zł` : ""} · obecność ✓
            </button>
          )}

          <button
            onClick={() => run("attended", onMarkAttended)}
            disabled={busyKey !== null}
            className="w-full rounded-b2b border bg-white px-4 py-3.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            Obecność ✓ · płatność później
          </button>

          {/* Outline, not solid: marking someone absent is a normal outcome, not a warning. */}
          <button
            onClick={() => run("no_show", onMarkNoShow)}
            disabled={busyKey !== null}
            className="w-full rounded-b2b border border-b2b-red-border bg-white px-4 py-3.5 text-center text-sm font-medium text-b2b-red-solid hover:bg-b2b-red-bg disabled:opacity-60"
          >
            Nieobecność
          </button>

          <p className="px-1 pt-1 text-xs text-gray-400">
            Nieobecność: rezerwacja oznaczona, płatność anulowana. Los wejścia z karnetu wynika z
            polityki odwołań studia.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

"use client";

import { useState } from "react";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

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
        <DrawerHeader>
          <DrawerTitle>{entry.user_email}</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-2 px-4 pb-6">
          {isCard ? (
            <button
              onClick={() => run("card", onMarkCardOk)}
              disabled={busyKey !== null}
              className="w-full rounded-xl bg-brand-green-700 px-4 py-3.5 text-left text-sm font-semibold text-white hover:bg-brand-green-700/90 disabled:opacity-60"
            >
              Karta OK · obecność ✓{amount != null ? ` (+${amount} zł dopłata)` : ""}
            </button>
          ) : (
            <button
              onClick={() => run("paid", onMarkPaid)}
              disabled={busyKey !== null}
              className="w-full rounded-xl bg-brand-green-700 px-4 py-3.5 text-left text-sm font-semibold text-white hover:bg-brand-green-700/90 disabled:opacity-60"
            >
              Zapłacono{amount != null ? ` ${amount} zł` : ""} · obecność ✓
            </button>
          )}

          <button
            onClick={() => run("attended", onMarkAttended)}
            disabled={busyKey !== null}
            className="w-full rounded-xl border bg-white px-4 py-3.5 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            Obecność ✓ · płatność później
          </button>

          <button
            onClick={() => run("no_show", onMarkNoShow)}
            disabled={busyKey !== null}
            className="w-full rounded-xl border border-red-100 bg-white px-4 py-3.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Nieobecność
          </button>

          <p className="px-1 pt-1 text-xs text-gray-400">
            Los wejścia z karnetu wynika z polityki odwołań studia — nie jest ustalany tutaj.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

"use client";

import { StatusChip } from "@/components/b2b/StatusChip";
import { Button } from "@/components/ui/button";

import type { RosterEntry } from "../types";

const FUNDING_LABELS: Record<string, string> = {
  drop_in: "Wejście jednorazowe",
  use_pass: "Karnet",
  sport_card: "Karta sportowa",
  buy_and_use: "Kup i użyj karnetu",
};

function initials(value: string): string {
  return value.slice(0, 2).toUpperCase();
}

/**
 * Recepcja row doctrine (reception-desk §1, applies to all B2B lists): state is a
 * flat colored chip, action is a button, **max one button per row**. Only two verbs
 * exist — "✓ Potwierdź" (nothing to decide) and "Rozlicz" (opens the one resolve
 * sheet). Resolved rows are dimmed in place, "Cofnij" only.
 */
export function RosterRow({
  entry,
  isBusy,
  onConfirm,
  onOpenResolve,
  onCorrectNoShow,
}: {
  entry: RosterEntry;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenResolve: () => void;
  onCorrectNoShow: () => void;
}) {
  const fundingLabel = FUNDING_LABELS[entry.funding_type] ?? entry.funding_type;
  const isCheckedIn = entry.checked_in_at != null;
  const isNoShow = entry.status === "no_show";
  // `is_overdue` is the backend's single source of truth for "still owes money" — it covers
  // the post-check-in sport-card surcharge case that a payment_status/needs_card_check
  // combination alone can't express (a card can be checked, then its surcharge left unpaid).
  const needsMoneyOrCard = entry.is_overdue;
  const needsCardCheck = entry.funding_type === "sport_card" && entry.needs_card_check;
  const isResolved = isNoShow || (isCheckedIn && !needsMoneyOrCard && !needsCardCheck);

  return (
    <div className={isResolved && !isNoShow ? "opacity-60" : undefined}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
          {initials(entry.user_email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{entry.user_email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {isNoShow ? (
              <StatusChip tone="gray">Nieobecność</StatusChip>
            ) : needsMoneyOrCard ? (
              <StatusChip tone="amber">
                Do zapłaty{entry.amount_owed != null ? ` · ${entry.amount_owed} zł` : ""}
              </StatusChip>
            ) : needsCardCheck ? (
              <StatusChip tone="amber">Sprawdź kartę</StatusChip>
            ) : isCheckedIn ? (
              <StatusChip tone="green">Obecność ✓</StatusChip>
            ) : (
              <StatusChip tone="gray">Oczekuje</StatusChip>
            )}
            <span className="text-xs text-gray-400">{fundingLabel}</span>
          </div>
        </div>

        {isNoShow ? (
          <button
            onClick={onCorrectNoShow}
            disabled={isBusy}
            className="shrink-0 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Cofnij
          </button>
        ) : isResolved ? null : needsMoneyOrCard || needsCardCheck ? (
          <Button size="sm" disabled={isBusy} onClick={onOpenResolve} className="shrink-0">
            Rozlicz
          </Button>
        ) : (
          <Button
            size="sm"
            variant="green"
            disabled={isBusy}
            onClick={onConfirm}
            className="shrink-0"
          >
            ✓ Potwierdź
          </Button>
        )}
      </div>
    </div>
  );
}

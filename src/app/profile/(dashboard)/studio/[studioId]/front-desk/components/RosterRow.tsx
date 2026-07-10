"use client";

import { cn } from "@/lib/utils";

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

interface RosterAction {
  key: string;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}

interface RosterRowProps {
  entry: RosterEntry;
  isBusy: boolean;
  onMarkPaid: () => void;
  onMarkCardOk: () => void;
  onMarkAttended: () => void;
  onMarkNoShow: () => void;
  onCorrectNoShow: () => void;
}

export function RosterRow({
  entry,
  isBusy,
  onMarkPaid,
  onMarkCardOk,
  onMarkAttended,
  onMarkNoShow,
  onCorrectNoShow,
}: RosterRowProps) {
  const fundingLabel = FUNDING_LABELS[entry.funding_type] ?? entry.funding_type;
  const isCheckedIn = entry.checked_in_at != null;
  const isNoShow = entry.status === "no_show";

  const actions: RosterAction[] = [];
  if (isNoShow) {
    actions.push({ key: "correct", label: "Cofnij nieobecność", onClick: onCorrectNoShow });
  } else {
    if (entry.funding_type === "use_pass" && !isCheckedIn) {
      actions.push({ key: "attend", label: "Obecny", onClick: onMarkAttended });
    }
    if (entry.funding_type === "sport_card" && entry.needs_card_check) {
      actions.push({ key: "card", label: "Karta OK + obecny", onClick: onMarkCardOk });
    }
    if (
      (entry.funding_type === "drop_in" || entry.funding_type === "buy_and_use") &&
      entry.payment_status === "unpaid"
    ) {
      actions.push({ key: "paid", label: "Obecny + zapłacił", onClick: onMarkPaid });
    }
    if (entry.funding_type === "sport_card" && entry.payment_status === "unpaid") {
      actions.push({ key: "surcharge", label: "Zapłacił dopłatę", onClick: onMarkPaid });
    }
    if (!isCheckedIn) {
      actions.push({
        key: "no_show",
        label: "Oznacz nieobecność",
        onClick: onMarkNoShow,
        tone: "danger",
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
          {initials(entry.user_email)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold text-gray-900">{entry.user_email}</p>
            {isNoShow && (
              <span className="shrink-0 rounded-full border border-red-100 bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
                Nieobecność
              </span>
            )}
            {entry.is_overdue && (
              <span className="shrink-0 rounded-full border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                Do rozliczenia
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {fundingLabel}
            {entry.amount_owed != null &&
              ` · ${entry.amount_owed.toLocaleString("pl-PL")} zł${
                entry.payment_status === "paid" ? " (zapłacone)" : ""
              }`}
          </p>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex divide-x border-t">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              disabled={isBusy}
              onClick={action.onClick}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50",
                action.tone === "danger" ? "text-red-600" : "text-gray-700",
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { IoChevronForward } from "react-icons/io5";

import { StatusChip } from "@/components/b2b/StatusChip";
import { formatMoney } from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { personLabel } from "@/lib/personDisplay";
import { cn } from "@/lib/utils";

import { fundingDetailLine } from "../fundingDetail";
import { isPendingEntry } from "../rosterGrouping";
import type { RosterEntry } from "../types";

/**
 * Recepcja row doctrine (spec §5.1/§5.2): state is a flat colored chip, action is a **single**
 * button that carries the amount when money is owed ("Potwierdź" / "Potwierdź · {amount} zł"),
 * so the desk never reads two places to know what tapping it collects. Tapping the row body
 * (anywhere but the button) always opens the per-person sheet — including a no-show row, whose
 * only correction path (`correct-no-show`, Decision 3) now lives there rather than as a
 * dedicated row button. Rows still resolved-or-absent dim in place and swap the button for a
 * chevron into the same sheet, so a mistake stays correctable.
 *
 * Layout is T1-v2: no avatar, name on its own line, then the chip and the funding detail, with
 * the single action in its own right-hand column. The chip/detail line wraps, which is what
 * produces the mockup's mix of two- and three-line rows depending on text length.
 */
export function RosterRow({
  entry,
  isBusy,
  onConfirm,
  onOpenResolve,
}: {
  entry: RosterEntry;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenResolve: () => void;
}) {
  const isCheckedIn = entry.checked_in_at != null;
  const isNoShow = entry.status === "no_show";
  // `needs_settlement` is the backend's answer to "is there anything left to resolve here,
  // right now" — money owed or a card unseen, following the buy-and-use pass chain that a
  // payment_status check alone misses. Deliberately *not* `is_overdue`, which additionally
  // requires the session to have already started: on a class running right now, a drop-in who
  // owes 45 zł must read "Do zapłaty", not "Oczekuje". Never recompute either client-side —
  // doing that undercounted money owed once already.
  const needsMoney = entry.needs_settlement ?? entry.is_overdue;
  const needsCardCheck = entry.funding_type === "sport_card" && entry.needs_card_check;
  const isPending = isPendingEntry(entry);
  const detail = fundingDetailLine(entry);

  return (
    <div
      className={cn("px-4 py-3.5", !isPending && "opacity-60")}
      onClick={onOpenResolve}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              !isPending ? "text-gray-500" : "text-gray-900",
            )}
          >
            {personLabel(entry.user_name, entry.user_email).primary}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {isNoShow ? (
              <StatusChip tone="gray">Nieobecność</StatusChip>
            ) : needsMoney ? (
              // A sport card that hasn't been seen yet is a verification task, not a payment
              // one — same amber, different ask.
              needsCardCheck ? (
                <StatusChip tone="amber">Sprawdź kartę</StatusChip>
              ) : (
                <StatusChip tone="amber">
                  Do zapłaty
                  {entry.amount_owed != null ? ` · ${formatMoney(entry.amount_owed)}` : ""}
                </StatusChip>
              )
            ) : needsCardCheck ? (
              <StatusChip tone="amber">Sprawdź kartę</StatusChip>
            ) : isCheckedIn ? (
              <StatusChip tone="green">Obecność ✓</StatusChip>
            ) : (
              <StatusChip tone="gray">Oczekuje</StatusChip>
            )}
            {detail && <span className="text-xs text-gray-500">{detail}</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
          {isPending ? (
            <Button size="sm" variant="green" disabled={isBusy} onClick={onConfirm}>
              {entry.amount_owed != null
                ? `Potwierdź · ${formatMoney(entry.amount_owed)}`
                : "Potwierdź"}
            </Button>
          ) : (
            // Resolved and no-show rows alike keep a way back into the sheet — a no-show's
            // only correction path lives there now (Decision 3).
            <button
              type="button"
              onClick={onOpenResolve}
              aria-label="Zmień rozstrzygnięcie"
              className="text-gray-300 hover:text-gray-500"
            >
              <IoChevronForward className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The 10-second strip a confirm leaves in place of the row (spec §6). Persists until the next
 * resolving action or 10s, whichever comes first — the parent owns that timer since it also
 * has to cancel it when a different row resolves.
 */
export function RosterRowUndoStrip({
  label,
  amount,
  isBusy,
  onUndo,
}: {
  label: string;
  amount: number | null;
  isBusy: boolean;
  onUndo: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3.5">
      <p className="min-w-0 truncate text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{label}</span>
        {" · "}
        {amount != null ? `zapłacono ${formatMoney(amount)}` : "obecność"}
      </p>
      <Button size="sm" variant="outline" disabled={isBusy} onClick={onUndo}>
        Cofnij
      </Button>
    </div>
  );
}

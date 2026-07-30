"use client";

import { IoChevronForward } from "react-icons/io5";

import { StatusChip } from "@/components/b2b/StatusChip";
import { Button } from "@/components/ui/button";
import { personLabel } from "@/lib/personDisplay";
import { cn } from "@/lib/utils";

import { fundingDetailLine } from "../fundingDetail";
import type { RosterEntry } from "../types";

/**
 * Recepcja row doctrine (reception-desk §1, applies to all B2B lists): state is a flat colored
 * chip, action is a button, **max one button per row**. Only two verbs exist — "✓ Potwierdź"
 * (nothing to decide) and "Rozlicz" (opens the one resolve sheet). Resolved rows dim in place
 * and swap their button for a chevron, so the sheet is still reachable to correct a mistake.
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
  onCorrectNoShow,
}: {
  entry: RosterEntry;
  isBusy: boolean;
  onConfirm: () => void;
  onOpenResolve: () => void;
  onCorrectNoShow: () => void;
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
  const isResolved = isNoShow || (isCheckedIn && !needsMoney && !needsCardCheck);
  const detail = fundingDetailLine(entry);

  return (
    <div className={cn("px-4 py-3.5", isResolved && "opacity-60")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isResolved ? "text-gray-500" : "text-gray-900",
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
                  Do zapłaty{entry.amount_owed != null ? ` · ${entry.amount_owed} zł` : ""}
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

        <div className="flex shrink-0 items-center">
          {isNoShow ? (
            <Button size="sm" variant="outline" disabled={isBusy} onClick={onCorrectNoShow}>
              Cofnij
            </Button>
          ) : isResolved ? (
            // Settled rows keep a way back into the sheet without offering a second verb.
            <button
              type="button"
              onClick={onOpenResolve}
              aria-label="Zmień rozstrzygnięcie"
              className="text-gray-300 hover:text-gray-500"
            >
              <IoChevronForward className="h-5 w-5" />
            </button>
          ) : needsMoney || needsCardCheck ? (
            <Button size="sm" disabled={isBusy} onClick={onOpenResolve}>
              Rozlicz
            </Button>
          ) : (
            <Button size="sm" variant="green" disabled={isBusy} onClick={onConfirm}>
              ✓ Potwierdź
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { isAxiosError } from "axios";
import { WalletCards } from "lucide-react";
import { useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { formatMoney } from "@/components/page-contents/studio/pricingHelpers";
import { axiosInstance } from "@/lib/axiosInstance";
import { personLabel } from "@/lib/personDisplay";

import type { PaidWithoutSeatItem, ReviewItem } from "../studio/[studioId]/front-desk/types";
import { PaymentReviewCard } from "./PaymentReviewCard";

/**
 * The two pinned payment piles (§9), above the reconciliation list.
 *
 * They sit above it rather than inside it because they are a different kind of problem. The
 * reconciliation list is money the studio is *waiting for* — it resolves itself when someone
 * pays at the desk. These two are money that already moved and went somewhere wrong, and
 * nothing will resolve them except a person deciding something.
 *
 * Same visual grammar as the list below (section heading, bordered card, chip + detail rows)
 * so they read as part of the same screen — but with buttons, because unlike a roster row
 * there is no sheet these open into and no attendance to confirm.
 */

function formatSession(startTime?: string | null): string | null {
  if (!startTime) return null;
  const when = new Date(startTime);
  return `${when.toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })}, ${when.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`;
}

export interface PaymentAttentionProps {
  paidWithoutSeat: PaidWithoutSeatItem[];
  needsReview: ReviewItem[];
  onChanged: () => Promise<void>;
}

export function PaymentAttention({
  paidWithoutSeat,
  needsReview,
  onChanged,
}: PaymentAttentionProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (paidWithoutSeat.length === 0 && needsReview.length === 0) return null;

  async function run(id: string, request: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await request();
      await onChanged();
      return true;
    } catch (error) {
      const detail: unknown = isAxiosError(error) ? error.response?.data?.detail : null;
      setError(
        typeof detail === "string"
          ? detail
          : "Nie udało się wykonać tej operacji. Spróbuj ponownie.",
      );
      return false;
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      {paidWithoutSeat.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Zapłacone bez miejsca
          </h2>
          <div className="overflow-hidden rounded-b2b border bg-white divide-y">
            {paidWithoutSeat.map((item) => {
              const session = formatSession(item.occurrence_start_time);
              return (
                <div key={item.order_id} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <WalletCards size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {personLabel(item.user_name, item.user_email).primary}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <StatusChip tone="amber">
                          Zapłacono · {formatMoney(item.amount_paid, item.currency)}
                        </StatusChip>
                        {session && <span className="text-xs text-gray-500">{session}</span>}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-snug text-gray-600">
                        Płatność dotarła po zwolnieniu miejsca i nie było już wolnych miejsc.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === item.order_id}
                    onClick={() =>
                      run(item.order_id, () =>
                        axiosInstance.post(`/orders/${item.order_id}/refund`, {
                          reason: "zapłacone bez miejsca",
                        }),
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busyId === item.order_id ? "Zwracam..." : "Zwróć pieniądze"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {needsReview.length > 0 && (
        <section id="payment-review" className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Do sprawdzenia
          </h2>
          <div className="overflow-hidden rounded-b2b border bg-white divide-y">
            {needsReview.map((item) => (
              <PaymentReviewCard
                key={item.id}
                item={item}
                busy={busyId != null}
                run={(request) => run(item.id, request)}
              />
            ))}
          </div>
        </section>
      )}

      {error && <p className="px-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

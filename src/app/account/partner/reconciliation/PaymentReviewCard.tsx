"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { formatMoney } from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import { personLabel } from "@/lib/personDisplay";

import type { ReviewItem } from "../studio/[studioId]/front-desk/types";

const reason: Record<ReviewItem["source"], string> = {
  amount_mismatch: "Niezgodna kwota",
  failed_refund: "Zwrot się nie powiódł",
  paid_after_session_cancellation: "Płatność po odwołaniu zajęć — zwrot do rozliczenia",
  onsite_reimbursement: "Zwrot płatności pobranej na miejscu",
  unknown_refund: "Sprawdź status zwrotu u operatora",
  refund_verification: "Sprawdź status zwrotu u operatora",
  expired_restored_pass: "Przywrócone wejście z wygasłego karnetu",
};

const outcomes = [
  { value: "settled", label: "Zwrot wykonany" },
  { value: "pending", label: "Zwrot w toku" },
  { value: "will_not_settle", label: "Zwrot nie zostanie wykonany" },
] as const;

export function PaymentReviewCard({
  item,
  busy,
  run,
}: {
  item: ReviewItem;
  busy: boolean;
  run: (request: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [form, setForm] = useState<"verify_refund" | "record_reimbursement" | null>(null);
  const [note, setNote] = useState("");
  const actions =
    item.actions ?? (item.can_retry_refund ? ["retry_refund", "acknowledge"] : ["acknowledge"]);
  const endpoint = `/payments/review-items/${item.id}`;
  const session = item.occurrence_start_time
    ? new Date(item.occurrence_start_time).toLocaleString("pl-PL", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : null;

  async function recordOutcome(outcome: string) {
    const succeeded = await run(() =>
      axiosInstance.post(`${endpoint}/resolve`, { refund_outcome: outcome, note: note.trim() }),
    );
    if (succeeded) {
      setForm(null);
      setNote("");
    }
  }

  return (
    <article className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {personLabel(item.user_name, item.user_email ?? "").primary}
          </p>
          <StatusChip tone="amber" className="max-w-full whitespace-normal">
            {reason[item.source]}
          </StatusChip>
          {(item.class_title || session) && (
            <p className="text-sm text-gray-700">
              {[item.class_title, session].filter(Boolean).join(" · ")}
            </p>
          )}
          {item.amount != null && item.currency && (
            <p className="text-sm font-semibold">{formatMoney(item.amount, item.currency)}</p>
          )}
          <p className="text-sm text-gray-600">{item.detail}</p>
          {item.booking_id && (
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer">Dane rezerwacji i płatności</summary>
              <dl className="mt-1 break-all">
                <dt>Rezerwacja</dt>
                <dd>{item.booking_id}</dd>
                {item.order_id && (
                  <>
                    <dt>Zamówienie</dt>
                    <dd>{item.order_id}</dd>
                  </>
                )}
                {item.payment_id && (
                  <>
                    <dt>Płatność</dt>
                    <dd>{item.payment_id}</dd>
                  </>
                )}
                {item.transaction_id && item.transaction_id !== item.payment_id && (
                  <>
                    <dt>Próba zwrotu</dt>
                    <dd>{item.transaction_id}</dd>
                  </>
                )}
              </dl>
            </details>
          )}
          {item.customer_path && (
            <Link
              href={item.customer_path}
              className="inline-block text-sm font-semibold underline"
            >
              Zobacz karnety uczestnika
            </Link>
          )}
        </div>
      </div>
      {form ? (
        <fieldset className="mt-3 space-y-2">
          <label className="block text-sm" htmlFor={`evidence-${item.id}`}>
            Potwierdzenie zwrotu
          </label>
          <Textarea
            id={`evidence-${item.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {(form === "verify_refund" ? outcomes : outcomes.slice(0, 1)).map(
              ({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy || !note.trim()}
                  onClick={() => void recordOutcome(value)}
                >
                  {label}
                </Button>
              ),
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => setForm(null)}>
              Anuluj
            </Button>
          </div>
        </fieldset>
      ) : (
        actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.includes("verify_refund") && (
              <Button variant="outline" size="sm" onClick={() => setForm("verify_refund")}>
                Zapisz status u operatora
              </Button>
            )}
            {actions.includes("record_reimbursement") && (
              <Button variant="outline" size="sm" onClick={() => setForm("record_reimbursement")}>
                Zapisz wykonany zwrot
              </Button>
            )}
            {actions.includes("refund_online") && item.order_id && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    axiosInstance.post(`/orders/${item.order_id}/refund`, {
                      reason: "zwrot po odwołaniu zajęć",
                    }),
                  )
                }
              >
                Zleć zwrot online
              </Button>
            )}
            {actions.includes("retry_refund") && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void run(() => axiosInstance.post(`${endpoint}/retry-refund`))}
              >
                Ponów zwrot
              </Button>
            )}
            {actions.includes("acknowledge") && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void run(() => axiosInstance.post(`${endpoint}/resolve`, {}))}
              >
                Oznacz jako sprawdzone
              </Button>
            )}
          </div>
        )
      )}
    </article>
  );
}

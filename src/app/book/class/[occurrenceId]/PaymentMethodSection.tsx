"use client";

import { Banknote, CreditCard } from "lucide-react";

import { OptionRadio, OptionRow } from "@/components/booking/OptionRow";

import type { OnlinePaymentMethod, PaymentMethod } from "./types";

/**
 * Two options, and only ever two: pay now, or pay at the studio.
 *
 * It used to offer one row per method — BLIK, karta, przelew, portfel — and every one of them
 * led to the same provider page, which asked again. Three of the four gateways ignored the
 * method we sent outright; the fourth honoured it, which would have made the checkout differ
 * by provider, and §4/§10 say it must not. So the second question is the provider's to ask,
 * and it is better placed to ask it: it knows what the studio's account can actually take
 * today, which our capability declaration only approximates.
 *
 * ⚠ **No provider name appears here, and none can.** If you ever find yourself wanting a
 * gateway logo on this screen, that is the requirement saying no.
 */
const METHOD_NAMES: Record<OnlinePaymentMethod, string> = {
  blik: "BLIK",
  card: "karta",
  transfer: "przelew",
  wallet: "Google Pay",
};

/** BLIK first: it is what a Polish customer scans for, and finding it is the reassurance. */
const METHOD_ORDER: OnlinePaymentMethod[] = ["blik", "card", "transfer", "wallet"];

function coverageLine(methods: OnlinePaymentMethod[]): string {
  const named = METHOD_ORDER.filter((m) => methods.includes(m)).map((m) => METHOD_NAMES[m]);
  // The methods are still worth naming even though they are no longer a choice — "can I pay
  // with BLIK here?" is the question this line exists to answer, before the redirect.
  return named.length > 0 ? named.join(" · ") : "Szybka płatność w internecie";
}

export interface PaymentMethodSectionProps {
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  onlineMethods: OnlinePaymentMethod[];
  acceptsCash: boolean;
}

export function PaymentMethodSection({
  method,
  onChange,
  onlineMethods,
  acceptsCash,
}: PaymentMethodSectionProps) {
  // Cash and online are independent, not alternatives — a studio may offer both, and turning
  // one on must not turn the other off.
  if (!acceptsCash && onlineMethods.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mt-6 text-lg font-extrabold text-gray-900">Jak zapłacisz?</h2>

      <div className="mt-4 space-y-2.5">
        {acceptsCash && (
          <OptionRow
            icon={<Banknote className="h-5 w-5 text-gray-700" />}
            title="Gotówką na miejscu"
            subtitle="Zapłać w studiu przed zajęciami"
            right={<OptionRadio selected={method === "cash"} />}
            selected={method === "cash"}
            onClick={() => onChange("cash")}
          />
        )}

        {onlineMethods.length > 0 && (
          <OptionRow
            icon={<CreditCard className="h-5 w-5 text-gray-700" />}
            title="Zapłać online"
            subtitle={coverageLine(onlineMethods)}
            right={<OptionRadio selected={method === "online"} />}
            selected={method === "online"}
            onClick={() => onChange("online")}
          />
        )}
      </div>
    </div>
  );
}

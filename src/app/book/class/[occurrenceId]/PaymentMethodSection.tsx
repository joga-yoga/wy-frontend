"use client";

import { Banknote, CreditCard } from "lucide-react";
import { useState } from "react";

import { OptionRadio, OptionRow } from "@/components/booking/OptionRow";

export interface PaymentMethodStudio {
  accepts_stripe: boolean;
}

export function PaymentMethodSection({ studio }: { studio: PaymentMethodStudio }) {
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const onlineVisible = studio.accepts_stripe;

  return (
    <div className="mt-6">
      <h2 className="mt-6 text-lg font-extrabold text-gray-900">Jak zapłacisz?</h2>

      <div className="mt-4 space-y-2.5">
        <OptionRow
          icon={<Banknote className="h-5 w-5 text-gray-700" />}
          title="Gotówką na miejscu"
          subtitle="Zapłać w studiu przed zajęciami"
          right={<OptionRadio selected={method === "cash"} />}
          selected={method === "cash"}
          onClick={() => setMethod("cash")}
        />
        {onlineVisible && (
          <div className="pointer-events-none opacity-60">
            <OptionRow
              icon={<CreditCard className="h-5 w-5 text-gray-400" />}
              title={
                <>
                  Online
                  <span className="ml-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 align-middle text-[10.5px] font-bold text-gray-500">
                    wkrótce
                  </span>
                </>
              }
              subtitle="Kartą lub BLIK"
              right={<OptionRadio selected={false} />}
              selected={false}
              onClick={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}

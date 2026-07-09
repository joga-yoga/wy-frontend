"use client";

import { useEffect, useState } from "react";

import { BookingDrawerShell } from "@/components/booking/BookingDrawerShell";
import { OptionRadio } from "@/components/booking/OptionRow";
import {
  discountPercent,
  formatMoney,
  LightPassTile,
  perEntry,
} from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { buyAndUseAsStudioPass, type BuyAndUsePassOption, type FundingSelection } from "./types";

function PassRow({
  option,
  dropInPrice,
  currency,
  selected,
  onClick,
}: {
  option: BuyAndUsePassOption;
  dropInPrice?: number | null;
  currency?: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  const asPass = buyAndUseAsStudioPass(option);
  const entry = perEntry(asPass);
  const discount = discountPercent(asPass, dropInPrice);
  const rowCurrency = option.currency || currency;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-2.5 flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] border-gray-200 bg-white p-3.5 text-left",
        selected && "border-2 border-brand-green-700 bg-brand-green-700/5 p-[13px]",
      )}
    >
      <LightPassTile sessionCount={option.session_count} durationDays={option.duration_days} />
      <div className="min-w-0 flex-1">
        <p className="text-[15.5px] font-extrabold text-gray-900">{option.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-semibold text-gray-500">
            {entry != null ? `${formatMoney(entry, rowCurrency)}/wejście` : "bez limitu wejść"}
          </span>
          {discount != null && (
            <span className="rounded-md bg-brand-green-700/10 px-1.5 py-0.5 text-[11.5px] font-extrabold text-brand-green-700">
              −{discount}%
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-lg font-extrabold text-gray-900">
          {formatMoney(option.price, rowCurrency)}
        </span>
        <OptionRadio selected={selected} />
      </div>
    </button>
  );
}

interface BuyPassDrawerProps {
  open: boolean;
  options: BuyAndUsePassOption[];
  dropInPrice?: number | null;
  currency?: string | null;
  onClose: () => void;
  onConfirm: (selection: FundingSelection) => void;
}

export function BuyPassDrawer({
  open,
  options,
  dropInPrice,
  currency,
  onClose,
  onConfirm,
}: BuyPassDrawerProps) {
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setPickedId(null);
  }, [open]);

  const picked = options.find((o) => o.pass_id === pickedId) ?? null;

  return (
    <BookingDrawerShell
      open={open}
      onClose={onClose}
      title="Kup karnet"
      subtitle="Zostanie użyty do tej rezerwacji."
      footer={
        <Button
          className="w-full"
          style={picked ? { background: "#4F8A62" } : undefined}
          variant={picked ? undefined : "secondary"}
          size="cta"
          disabled={!picked}
          onClick={() => {
            if (!picked) return;
            onConfirm({
              kind: "buy_and_use",
              passId: picked.pass_id,
              passName: picked.name,
              price: picked.price,
              currency: picked.currency ?? null,
            });
          }}
        >
          {picked
            ? `Wybierz karnet · ${formatMoney(picked.price, picked.currency || currency)}`
            : "Wybierz karnet"}
        </Button>
      }
    >
      {options.map((option) => (
        <PassRow
          key={option.pass_id}
          option={option}
          dropInPrice={dropInPrice}
          currency={currency}
          selected={pickedId === option.pass_id}
          onClick={() => setPickedId(option.pass_id)}
        />
      ))}
    </BookingDrawerShell>
  );
}

"use client";

import { useEffect, useState } from "react";

import { BookingDrawerShell } from "@/components/booking/BookingDrawerShell";
import { OptionRadio } from "@/components/booking/OptionRow";
import { SportCardLogo } from "@/components/booking/SportCardLogo";
import { formatMoney } from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { FundingSelection, SportCardOption } from "./types";

function CardRow({
  option,
  currency,
  selected,
  onClick,
}: {
  option: SportCardOption;
  currency?: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  const hasFee = option.fee != null && option.fee > 0;
  const name = option.name || "Karta sportowa";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-2.5 flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] border-gray-200 bg-white px-3.5 py-3 text-left",
        selected && "border-2 border-brand-green-700 bg-brand-green-700/5 px-[13px] py-[11px]",
      )}
    >
      <SportCardLogo photo={option.photo} alt={name} width={52} height={34} />
      <p className="min-w-0 flex-1 text-[15px] font-bold text-gray-900">{name}</p>
      <span
        className={cn(
          "shrink-0 text-[13px] font-bold",
          hasFee ? "text-gray-500" : "text-brand-green-700",
        )}
      >
        {hasFee ? `dopłata ${formatMoney(option.fee, currency)}` : "bez dopłaty"}
      </span>
      <OptionRadio selected={selected} />
    </button>
  );
}

interface SportCardDrawerProps {
  open: boolean;
  options: SportCardOption[];
  currency?: string | null;
  selectedSportCardId?: string | null;
  onClose: () => void;
  onConfirm: (selection: FundingSelection) => void;
}

export function SportCardDrawer({
  open,
  options,
  currency,
  selectedSportCardId,
  onClose,
  onConfirm,
}: SportCardDrawerProps) {
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setPickedId(selectedSportCardId ?? null);
  }, [open, selectedSportCardId]);

  const picked = options.find((o) => o.studio_sport_card_id === pickedId) ?? null;
  const pickedHasFee = picked?.fee != null && picked.fee > 0;

  return (
    <BookingDrawerShell
      open={open}
      onClose={onClose}
      title="Karta sportowa"
      subtitle="Kartę sprawdzimy w studiu przed zajęciami."
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
              kind: "sport_card",
              studioSportCardId: picked.studio_sport_card_id,
              cardName: picked.name || "Karta sportowa",
              fee: picked.fee ?? null,
            });
            onClose();
          }}
        >
          {picked
            ? `Wybierz kartę · ${pickedHasFee ? `dopłata ${formatMoney(picked.fee, currency)}` : "bez dopłaty"}`
            : "Wybierz kartę"}
        </Button>
      }
    >
      {options.map((option) => (
        <CardRow
          key={option.studio_sport_card_id}
          option={option}
          currency={currency}
          selected={pickedId === option.studio_sport_card_id}
          onClick={() => setPickedId(option.studio_sport_card_id)}
        />
      ))}
    </BookingDrawerShell>
  );
}

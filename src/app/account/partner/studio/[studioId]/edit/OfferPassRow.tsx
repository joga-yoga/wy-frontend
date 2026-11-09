"use client";

import { Trash2 } from "lucide-react";

import {
  discountPercent,
  formatMoney,
  LightPassTile,
  perEntry,
} from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";

import type { StudioPass } from "./types";

/** Offer definition only; each parent keeps its own API or draft persistence. */
export function OfferPassRow({
  pass,
  currency = "PLN",
  dropInPrice,
  onEdit,
  onRemove,
}: {
  pass: StudioPass;
  currency?: string | null;
  dropInPrice?: number | null;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const sessionCount = pass.session_count != null ? Number(pass.session_count) : null;
  const durationDays = pass.duration_days != null ? Number(pass.duration_days) : null;
  const passCurrency = pass.currency || currency;
  const priceable = { price: Number(pass.price), session_count: sessionCount };
  const entryPrice = perEntry(priceable);
  const discount = discountPercent(priceable, dropInPrice);
  const subtitle = [
    pass.description,
    entryPrice != null ? `${formatMoney(entryPrice, passCurrency)}/wejście` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5">
      <button
        type="button"
        aria-label={`Edytuj karnet ${pass.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={onEdit}
      >
        <LightPassTile
          sessionCount={sessionCount}
          durationDays={pass.duration_unknown ? 0 : durationDays}
          sessionCountUnknown={pass.session_count_unknown}
          size={48}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#222222]">{pass.name}</span>
            {discount != null && (
              <span className="shrink-0 text-xs font-semibold text-emerald-600">−{discount}%</span>
            )}
          </span>
          {subtitle && (
            <span className="mt-0.5 block truncate text-xs text-[#717171]">{subtitle}</span>
          )}
        </span>
        <span className="shrink-0 text-sm font-semibold text-[#222222]">
          {formatMoney(Number(pass.price), passCurrency)}
        </span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Usuń karnet ${pass.name}`}
        className="size-11 shrink-0 text-muted-foreground"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

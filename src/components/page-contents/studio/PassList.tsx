"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { StudioPass } from "@/types/studio";

import { PassDetailBody } from "./PassDetailBody";
import { discountPercent, formatMoney, LightPassTile, perEntry } from "./pricingHelpers";

interface PassListProps {
  passes: StudioPass[];
  dropInPrice?: number | null;
  currency?: string | null;
}

/** Shared pass-card list + tappable detail drawer, used by both the studio page's
 * `Cennik` section and the session drawer's pricing row (T06). Canonical copy/limits
 * are the studio page's pre-existing ones: `hasDropIn ? 2 : 3` visible passes, "Pokaż
 * wszystkie karnety" show-more button with no count suffix. */
export function PassList({ passes, dropInPrice, currency = "PLN" }: PassListProps) {
  const router = useRouter();
  const hasDropIn = dropInPrice != null;
  const [selectedPass, setSelectedPass] = useState<StudioPass | null>(null);
  const [showDropIn, setShowDropIn] = useState(false);
  const [showAllPasses, setShowAllPasses] = useState(false);

  if (!hasDropIn && passes.length === 0) return null;

  const passLimit = hasDropIn ? 2 : 3;
  const visiblePasses = showAllPasses ? passes : passes.slice(0, passLimit);
  const hiddenPassCount = passes.length - passLimit;

  return (
    <>
      <div className="divide-y divide-gray-100">
        {hasDropIn && (
          <button
            type="button"
            onClick={() => setShowDropIn(true)}
            className="flex w-full items-center gap-4 py-3 text-left"
          >
            <LightPassTile sessionCount={1} durationDays={0} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-[#222222]">Pojedyncze wejście</h3>
              <p className="mt-0.5 text-sm text-[#717171]">Bez karnetu i karty sportowej</p>
            </div>
            <span className="shrink-0 text-lg font-semibold text-[#222222]">
              {formatMoney(dropInPrice, currency)}
            </span>
          </button>
        )}
        {visiblePasses.map((pass) => {
          const entryPrice = perEntry(pass);
          const discount = discountPercent(pass, dropInPrice);
          const subtitle = [
            pass.description,
            entryPrice != null
              ? `${formatMoney(entryPrice, pass.currency || currency)}/wejście`
              : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <button
              key={pass.id}
              type="button"
              onClick={() => setSelectedPass(pass)}
              className="flex w-full items-center gap-4 py-3 text-left"
            >
              <LightPassTile sessionCount={pass.session_count} durationDays={pass.duration_days} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-[#222222]">{pass.name}</h3>
                  {discount != null && (
                    <span className="text-sm font-semibold text-emerald-600">−{discount}%</span>
                  )}
                </div>
                {subtitle && (
                  <p className="mt-0.5 text-sm leading-snug text-[#717171]">{subtitle}</p>
                )}
              </div>
              <span className="shrink-0 text-lg font-semibold text-[#222222]">
                {formatMoney(pass.price, pass.currency || currency)}
              </span>
            </button>
          );
        })}
      </div>
      {!showAllPasses && hiddenPassCount > 0 && (
        <Button
          variant="muted"
          className="mt-3 h-12 w-full rounded-xl"
          onClick={() => setShowAllPasses(true)}
        >
          Pokaż wszystkie karnety
        </Button>
      )}

      <Drawer open={selectedPass != null} onOpenChange={(o) => !o && setSelectedPass(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedPass?.name ?? ""}</DrawerTitle>
          </DrawerHeader>
          {selectedPass && (
            <div className="px-4 pb-6">
              <PassDetailBody pass={selectedPass} dropInPrice={dropInPrice} currency={currency} />
              <Button
                variant="green"
                size="cta"
                className="mt-5 w-full"
                onClick={() => router.push(`/book/pass/${selectedPass.id}`)}
              >
                Kup karnet · {formatMoney(selectedPass.price, selectedPass.currency || currency)}
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={showDropIn} onOpenChange={setShowDropIn}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pojedyncze wejście</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <div className="mb-5 flex items-center gap-4">
              <LightPassTile sessionCount={1} durationDays={0} />
              <span className="text-2xl font-bold text-[#222222]">
                {formatMoney(dropInPrice, currency)}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-[#222222]">
              Cena za jedno wejście bez karnetu i bez karty sportowej.
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export function hasPassPricing(passes: StudioPass[], dropInPrice?: number | null): boolean {
  return dropInPrice != null || passes.length > 0;
}

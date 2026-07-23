"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { StudioPass } from "@/types/studio";

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
          {selectedPass &&
            (() => {
              const passCurrency = selectedPass.currency || currency;
              const entry = perEntry(selectedPass);
              const discount = discountPercent(selectedPass, dropInPrice);
              const isUnlimitedSessions = selectedPass.session_count == null;
              const isUnlimitedDays = selectedPass.duration_days == null;

              return (
                <div className="px-4 pb-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <LightPassTile
                        sessionCount={selectedPass.session_count}
                        durationDays={selectedPass.duration_days}
                      />
                      <span className="text-2xl font-bold text-[#222222]">
                        {formatMoney(selectedPass.price, passCurrency)}
                      </span>
                    </div>
                    {discount != null && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        −{discount}%
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100 rounded-xl bg-[#FAFAFA] px-4">
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-[#717171]">Wejścia</span>
                      <span className="text-sm font-medium text-[#222222]">
                        {isUnlimitedSessions ? "Bez limitu" : selectedPass.session_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-[#717171]">Ważność</span>
                      <span className="text-sm font-medium text-[#222222]">
                        {isUnlimitedDays ? "Bezterminowo" : `${selectedPass.duration_days} dni`}
                      </span>
                    </div>
                    {entry != null && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-[#717171]">Cena za wejście</span>
                        <span className="text-sm font-medium text-[#222222]">
                          {formatMoney(entry, passCurrency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedPass.description && (
                    <p className="mt-4 text-sm leading-relaxed text-[#717171]">
                      {selectedPass.description}
                    </p>
                  )}
                </div>
              );
            })()}
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

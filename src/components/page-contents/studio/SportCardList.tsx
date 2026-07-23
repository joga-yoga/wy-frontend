"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

import { SportCardLogo } from "@/components/booking/SportCardLogo";
import { WyImage } from "@/components/custom/WyImage";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { StudioSportCardAcceptance } from "@/types/studio";

import { formatMoney, sportCardName, sportCardPhoto } from "./pricingHelpers";

interface SportCardListProps {
  acceptsSportCards: boolean | null | undefined;
  acceptances: StudioSportCardAcceptance[];
  currency?: string | null;
}

/** Shared sport-card row list + tappable detail drawer, used by both the studio page's
 * `Karty sportowe` section and the session drawer's pricing row (T06). Per spec, shows
 * every accepted card with no truncation (the studio page previously capped at 3; the
 * drawer never did — canonical behavior is "show all"). */
export function SportCardList({
  acceptsSportCards,
  acceptances,
  currency = "PLN",
}: SportCardListProps) {
  const [selectedCard, setSelectedCard] = useState<StudioSportCardAcceptance | null>(null);

  if (acceptsSportCards == null) return null;

  const selectedPhoto = selectedCard ? sportCardPhoto(selectedCard) : null;
  const selectedDescription =
    selectedCard?.description || selectedCard?.sport_card?.description || null;

  return (
    <div>
      <p className="mb-2 text-sm text-[#717171]">
        Akceptujemy karty sportowe. Przy niektórych kartach może obowiązywać dopłata za wejście.
      </p>
      {acceptsSportCards === false ? (
        <p className="text-sm text-[#717171]">Studio nie akceptuje kart sportowych.</p>
      ) : (
        <>
          {acceptances.map((item, i) => {
            const photo = sportCardPhoto(item);
            const hasFee = item.fee != null && item.fee > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedCard(item)}
                className={`flex w-full items-center gap-3 py-3 text-left${i > 0 ? " border-t border-gray-100" : ""}`}
              >
                <SportCardLogo photo={photo} alt={sportCardName(item)} width={56} height={40} />
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#222222]">
                  {sportCardName(item)}
                </p>
                <span
                  className={`shrink-0 text-sm ${hasFee ? "text-[#717171]" : "font-medium text-emerald-600"}`}
                >
                  {hasFee ? `dopłata ${formatMoney(item.fee, currency)}` : "bez dopłaty"}
                </span>
              </button>
            );
          })}
          {acceptances.length === 0 && (
            <p className="py-3 text-sm text-[#717171]">
              Lista akceptowanych kart pojawi się po uzupełnieniu profilu.
            </p>
          )}
        </>
      )}

      <Drawer open={selectedCard != null} onOpenChange={(o) => !o && setSelectedCard(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedCard ? sportCardName(selectedCard) : ""}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {selectedPhoto ? (
              <div className="mb-4 overflow-hidden rounded-xl">
                <WyImage
                  src={selectedPhoto}
                  alt={selectedCard ? sportCardName(selectedCard) : ""}
                  width={560}
                  height={320}
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="mb-4 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl bg-[#F5F3EE]">
                <CreditCard className="h-8 w-8 text-[#BBBBBB]" />
              </div>
            )}
            <div className="space-y-3">
              <p className="text-[15px] leading-relaxed text-[#222222]">
                {selectedCard?.fee != null && selectedCard.fee > 0 ? (
                  <>
                    Akceptujemy kartę{" "}
                    <strong>{selectedCard ? sportCardName(selectedCard) : ""}</strong>. Do każdego
                    wejścia obowiązuje dopłata {formatMoney(selectedCard.fee, currency)}.
                  </>
                ) : (
                  <>
                    Akceptujemy kartę{" "}
                    <strong>{selectedCard ? sportCardName(selectedCard) : ""}</strong> bez
                    dodatkowych opłat.
                  </>
                )}
              </p>
              {selectedDescription && (
                <p className="text-sm leading-relaxed text-[#717171]">{selectedDescription}</p>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

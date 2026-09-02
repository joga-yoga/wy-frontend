"use client";

import { CreditCard, X } from "lucide-react";
import { useState } from "react";

import { SportCardLogo } from "@/components/booking/SportCardLogo";
import { WyImage } from "@/components/custom/WyImage";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
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
  const selectedHasFee = selectedCard?.fee != null && selectedCard.fee > 0;

  return (
    <div>
      {/* ⚠ **Inside the branch, not above it.** This line used to render unconditionally, so a
          studio that answered "Nie" read "Akceptujemy karty sportowe…" immediately followed by
          "Nie przyjmujemy kart sportowych…" — the contradiction in WY-68. The `false` state was
          never missing logic; the affirmative copy was simply on the wrong side of the branch.
          Both branches speak as the studio ("my"), per the tone-of-voice rule in AGENTS.md. */}
      {acceptsSportCards === false ? (
        <p className="text-sm text-[#717171]">
          Nie przyjmujemy kart sportowych — zapraszamy na karnet lub pojedyncze wejście.
        </p>
      ) : (
        <>
          <p className="mb-2 text-sm text-[#717171]">
            Akceptujemy karty sportowe. Przy niektórych kartach może obowiązywać dopłata za wejście.
          </p>
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
              Wkrótce dodamy listę kart, które przyjmujemy.
            </p>
          )}
        </>
      )}

      <Drawer
        open={selectedCard != null}
        onOpenChange={(o) => !o && setSelectedCard(null)}
        showSwipeHandle
      >
        <DrawerContent>
          <div className="flex items-center justify-end px-4 pb-2 pt-2">
            <DrawerTitle className="sr-only">
              {selectedCard ? sportCardName(selectedCard) : ""}
            </DrawerTitle>
            <DrawerClose
              aria-label="Zamknij"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm"
            >
              <X className="h-5 w-5" />
            </DrawerClose>
          </div>
          <div className="px-4 pb-6">
            <h2 className="mb-4 text-lg font-bold text-[#222222]">
              {selectedCard ? sportCardName(selectedCard) : ""}
            </h2>
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
            {selectedDescription && (
              <p className="text-base leading-relaxed text-[#717171]">{selectedDescription}</p>
            )}
            <div className="mt-4 divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3">
                <span className="text-base text-[#717171]">Dopłata</span>
                <span
                  className={`text-base font-medium ${selectedHasFee ? "text-[#222222]" : "text-emerald-600"}`}
                >
                  {selectedHasFee ? formatMoney(selectedCard?.fee, currency) : "Bez dopłaty"}
                </span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

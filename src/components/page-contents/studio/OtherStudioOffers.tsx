import { getCurrencySymbol } from "@/lib/currency";
import type { DirectoryOffer } from "@/types/studio";

export function OtherStudioOffers({
  offers,
  currency,
}: {
  offers: DirectoryOffer[];
  currency?: string | null;
}) {
  if (!offers.length) return null;
  const others = offers;
  const symbol = getCurrencySymbol(currency);
  return (
    <div className="mt-5">
      <h3 className="text-m-sunscript-font mb-1 text-gray-500">Pozostałe ceny</h3>
      <div className="divide-y divide-gray-100">
        {others.slice(0, 6).map((offer, index) => (
          <div
            key={`${offer.name ?? "offer"}-${index}`}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-base font-semibold text-[#222222]">{offer.name ?? "Oferta"}</p>
              {offer.category && <p className="mt-0.5 text-sm text-[#717171]">{offer.category}</p>}
            </div>
            <span className="shrink-0 text-base font-semibold text-[#222222]">
              {offer.price_text ?? (offer.amount != null ? `${offer.amount} ${symbol}` : "—")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

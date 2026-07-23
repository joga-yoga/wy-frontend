import { discountPercent, formatMoney, LightPassTile, perEntry } from "./pricingHelpers";

interface PassDetailBodyPass {
  name: string;
  price: number;
  currency?: string | null;
  description?: string | null;
  duration_days?: number | null;
  session_count?: number | null;
}

interface PassDetailBodyProps {
  pass: PassDetailBodyPass;
  dropInPrice?: number | null;
  currency?: string | null;
}

/** Tile+title+price/discount + description + Wejścia/Ważność/Cena-za-wejście rows, shared by
 * `PassList`'s tappable detail drawer and the standalone `/book/pass/[passId]` checkout screen. */
export function PassDetailBody({ pass, dropInPrice, currency = "PLN" }: PassDetailBodyProps) {
  const passCurrency = pass.currency || currency;
  const entry = perEntry(pass);
  const discount = discountPercent(pass, dropInPrice);
  const isUnlimitedSessions = pass.session_count == null;
  const isUnlimitedDays = pass.duration_days == null;

  return (
    <div>
      <div className="flex items-center gap-4">
        <LightPassTile sessionCount={pass.session_count} durationDays={pass.duration_days} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#222222]">{pass.name}</h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#222222]">
              {formatMoney(pass.price, passCurrency)}
            </span>
            {discount != null && (
              <span className="text-base font-semibold text-emerald-600">−{discount}%</span>
            )}
          </div>
        </div>
      </div>

      {pass.description && (
        <p className="mt-4 text-sm leading-relaxed text-[#717171]">{pass.description}</p>
      )}

      <div className="mt-4 divide-y divide-gray-100">
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-[#717171]">Wejścia</span>
          <span className="text-sm font-medium text-[#222222]">
            {isUnlimitedSessions ? "Bez limitu" : pass.session_count}
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-[#717171]">Ważność</span>
          <span className="text-sm font-medium text-[#222222]">
            {isUnlimitedDays ? "Bezterminowo" : `${pass.duration_days} dni`}
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
    </div>
  );
}

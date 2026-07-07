import { IoInfinite as InfiniteIcon } from "react-icons/io5";

import { getCurrencySymbol } from "@/lib/currency";
import type { StudioPass, StudioSportCardAcceptance } from "@/types/studio";

export function formatMoney(value: number | null | undefined, currency?: string | null) {
  if (value == null) return "";
  return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} ${getCurrencySymbol(currency || "PLN")}`;
}

export function perEntry(pass: StudioPass) {
  if (!pass.session_count || pass.session_count <= 0) return null;
  return pass.price / pass.session_count;
}

export function discountPercent(pass: StudioPass, dropInPrice?: number | null) {
  const entry = perEntry(pass);
  if (!entry || !dropInPrice || dropInPrice <= 0 || entry >= dropInPrice) return null;
  return Math.round((1 - entry / dropInPrice) * 100);
}

export function sportCardName(item: StudioSportCardAcceptance) {
  return item.sport_card?.name ?? item.name ?? "Karta sportowa";
}

export function sportCardPhoto(item: StudioSportCardAcceptance) {
  return item.sport_card?.photo ?? item.photo ?? null;
}

export function LightPassTile({
  sessionCount,
  durationDays,
}: {
  sessionCount?: number | null;
  durationDays?: number | null;
}) {
  const isUnlimitedSessions = sessionCount == null;
  const isUnlimitedDays = durationDays == null;
  const hideDuration = durationDays === 0;

  return (
    <div className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#F5F3EE]">
      {isUnlimitedSessions ? (
        <InfiniteIcon className="size-7 text-[#222222]" />
      ) : (
        <span className="text-2xl font-semibold leading-none text-[#222222]">{sessionCount}</span>
      )}
      {!hideDuration && (
        <span className="mt-0.5 flex items-center text-[14px] font-medium text-[#888888]">
          {isUnlimitedDays ? (
            <>
              <InfiniteIcon className="mr-0.5 size-3" /> dni
            </>
          ) : (
            <>{durationDays} dni</>
          )}
        </span>
      )}
    </div>
  );
}

import { IoInfinite as InfiniteIcon } from "react-icons/io5";

import { getCurrencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";
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
  size = 72,
}: {
  sessionCount?: number | null;
  durationDays?: number | null;
  size?: number;
}) {
  const isUnlimitedSessions = sessionCount == null;
  const isUnlimitedDays = durationDays == null;
  const hideDuration = durationDays === 0;
  const compact = size <= 48;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-[6px]",
        isUnlimitedSessions ? "bg-brand-green-700" : "bg-[#F5F3EE]",
      )}
      style={{ width: size, height: size }}
    >
      {isUnlimitedSessions ? (
        <InfiniteIcon className={cn("text-white", compact ? "size-5" : "size-7")} />
      ) : (
        <span
          className={cn(
            compact ? "text-lg" : "text-2xl",
            "font-semibold leading-none text-[#222222]",
          )}
        >
          {sessionCount}
        </span>
      )}
      {!hideDuration && (
        <span
          className={cn(
            "mt-0.5 flex items-center font-medium",
            isUnlimitedSessions ? "text-gray-200" : "text-[#888888]",
            compact ? "text-[9px]" : "text-[14px]",
          )}
        >
          {isUnlimitedDays ? (
            <>
              <InfiniteIcon className={cn("mr-0.5", compact ? "size-2.5" : "size-3")} /> dni
            </>
          ) : (
            <>{durationDays} dni</>
          )}
        </span>
      )}
    </div>
  );
}

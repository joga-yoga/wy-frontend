import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PickedOptionRow({
  left,
  kicker,
  name,
  sub,
  price,
  priceAccent,
  onChange,
}: {
  left: ReactNode;
  kicker: string;
  name: ReactNode;
  sub: ReactNode;
  price: ReactNode;
  priceAccent?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center gap-3.5 rounded-2xl border-2 border-brand-green-700 bg-brand-green-700/5 px-[15px] py-[13px] text-left transition-colors"
    >
      {left}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-normal text-brand-green-700">
          {kicker}
        </p>
        <p className="mt-0.5 truncate text-[15px] font-extrabold text-gray-900">{name}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-gray-500">{sub}</p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-extrabold",
            priceAccent ? "text-brand-green-700" : "text-gray-900",
          )}
        >
          {price}
        </p>
        <p className="mt-1 text-[12px] font-bold text-brand-green-700">Zmień</p>
      </div>
    </button>
  );
}

"use client";

import { IoInfinite as InfiniteIcon } from "react-icons/io5";

import { StatusChip } from "@/components/b2b/StatusChip";
import { plural, wejscia } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";

import type { MyPassWalletOut } from "../types";

/** Above this, individual segments stop being countable at a glance and a continuous bar
 *  communicates "how full" better than sixty slivers do. */
const MAX_SEGMENTS = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/**
 * One pass, full-width, as the customer's own card (WY-71).
 *
 * `components/b2b/PassCard` is the compact row shared by the two B2B client screens, and it
 * stays exactly as it is — this is a second, larger shape for the surface the issue is about,
 * not a redesign of theirs.
 *
 * **The meter is segmented, one segment per entry.** A continuous bar answers "roughly how
 * much is left"; a customer with a 10-entry pass is asking "how many", and counting seven
 * filled marks answers that without reading the number twice. Above `MAX_SEGMENTS` the
 * segments stop being countable and it falls back to a single bar.
 *
 * The four states keep the meanings `PassCard`'s docstring established, because a pass must
 * not read differently on two screens: `used` shows a **full** grey meter (spent, not unused),
 * `expired` drops the meter entirely and names what was forfeited, and `cancelled` explains
 * itself — "Anulowany" alone leaves the customer asking why.
 */
export function PassTicketCard({
  pass,
  onClick,
  className,
}: {
  pass: MyPassWalletOut;
  onClick?: () => void;
  className?: string;
}) {
  const { state, entries_total, entries_left, valid_until } = pass;
  const unlimited = entries_total === null;
  const total = entries_total ?? 0;
  const left = entries_left ?? 0;
  const used = unlimited ? 0 : total - left;

  const isActive = state === "active";
  const isUsed = state === "used";
  const isExpired = state === "expired";
  const isCancelled = state === "cancelled";
  const showMeter = !unlimited && !isExpired && !isCancelled;

  const isInteractive = Boolean(onClick);

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
          : undefined
      }
      className={cn(
        "rounded-b2b border-[1.5px] bg-white px-4 py-4 transition-colors",
        isActive ? "border-b2b-green-text/35" : "border-gray-200",
        isExpired && "bg-gray-50",
        isCancelled && "border-b2b-red-border",
        isInteractive && "cursor-pointer hover:bg-gray-50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-gray-500">{pass.studio_name}</p>
          <p
            className={cn(
              "truncate text-lg font-bold",
              isExpired || isCancelled ? "text-gray-600" : "text-gray-900",
            )}
          >
            {pass.pass_name}
          </p>
        </div>
        <PassStateChip pass={pass} />
      </div>

      {unlimited && !isExpired && !isCancelled ? (
        <div className="mt-4 flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              isActive ? "bg-brand-green-700 text-white" : "bg-gray-100 text-gray-400",
            )}
          >
            <InfiniteIcon className="size-6" />
          </span>
          <span
            className={cn(
              "text-base font-semibold",
              isActive ? "text-b2b-green-text" : "text-gray-500",
            )}
          >
            Bez limitu wejść
          </span>
        </div>
      ) : showMeter ? (
        <div className="mt-4">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-3xl font-bold tabular-nums leading-none",
                isUsed ? "text-gray-400" : "text-gray-900",
              )}
            >
              {left}
            </span>
            <span className="text-base text-gray-400">/ {total}</span>
            <span className="ml-1 text-sm text-gray-500">
              {isUsed ? "wykorzystany" : `${plural(left, "wejście", "wejścia", "wejść")} zostało`}
            </span>
          </div>
          <Meter total={total} used={isUsed ? total : used} muted={isUsed} />
        </div>
      ) : isExpired ? (
        used < total &&
        !unlimited && (
          <p className="mt-3 text-sm text-gray-500">
            {wejscia(total - used)} {plural(total - used, "przepadło", "przepadły", "przepadło")}
          </p>
        )
      ) : (
        <p className="mt-3 text-sm text-b2b-red-text">
          Płatność nie doszła do skutku — karnet unieważniony
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {valid_until && !isCancelled
            ? isExpired
              ? `Wygasł ${formatDate(valid_until)}`
              : `Ważny do ${formatDate(valid_until)}`
            : ""}
        </span>
        {pass.is_paid === false && <StatusChip tone="amber">Niezapłacony</StatusChip>}
      </div>
    </div>
  );
}

/** One segment per entry, so "how many are left" is countable rather than estimated. */
function Meter({ total, used, muted }: { total: number; used: number; muted: boolean }) {
  if (total > MAX_SEGMENTS) {
    const pct = total === 0 ? 0 : Math.min(100, Math.round((used / total) * 100));
    return (
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full", muted ? "bg-gray-300" : "bg-b2b-green-text")}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }
  return (
    <div className="mt-3 flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 flex-1 rounded-full",
            i < used ? (muted ? "bg-gray-300" : "bg-b2b-green-text") : "bg-gray-100",
          )}
        />
      ))}
    </div>
  );
}

/** The expired chip carries its date elsewhere on the card, so here it stays a bare state. */
function PassStateChip({ pass }: { pass: MyPassWalletOut }) {
  if (pass.state === "cancelled") return <StatusChip tone="rose">Anulowany</StatusChip>;
  if (pass.state === "used") return <StatusChip tone="gray">Wykorzystany</StatusChip>;
  if (pass.state === "expired") return <StatusChip tone="gray">Wygasł</StatusChip>;
  return <StatusChip tone="green">Aktywny</StatusChip>;
}

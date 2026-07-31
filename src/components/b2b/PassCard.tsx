import { StatusChip } from "@/components/b2b/StatusChip";
import { plural, wejscGenitive, wejscia } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";

export type PassState = "active" | "used" | "expired" | "cancelled";

/** The wallet shape shared by K2, K3 and the B2C wallet — `PassWalletOut` on the wire. */
export interface PassCardData {
  state: PassState;
  pass_name: string;
  entries_total: number | null;
  entries_left: number | null;
  valid_until: string | null;
  purchased_at?: string | null;
  price?: number | null;
  duration_days?: number | null;
  is_paid?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/**
 * One pass, in all four states (mockups K2, K3 and F2).
 *
 * Built once and shared across the partner's view of a client's pass and the client's own
 * view of it. Those are two surfaces showing the same row, and part 1's bugs clustered in
 * exactly that shape — a card built twice is a card that eventually disagrees with itself.
 *
 * K3 draws each state differently on purpose, and the differences carry the meaning:
 * `used` shows a full grey bar rather than an empty one (the pass was spent, not unused),
 * `expired` drops the bar entirely and names what was forfeited, and `cancelled` explains
 * itself because "Anulowany" alone leaves the client asking why.
 */
export function PassCard({
  pass,
  meta,
  showState = true,
  className,
}: {
  pass: PassCardData;
  /** Overrides the default "kupiony … · N zł" line. B2C puts the studio name here (F2). */
  meta?: React.ReactNode;
  /** F2's active card carries no chip — the wallet's presence already says it is usable. */
  showState?: boolean;
  className?: string;
}) {
  const { state, pass_name, entries_total, entries_left, valid_until } = pass;
  const unlimited = entries_total === null;
  const total = entries_total ?? 0;
  const left = entries_left ?? 0;
  const used = unlimited ? 0 : total - left;
  const pct = unlimited || total === 0 ? 0 : Math.min(100, Math.round((used / total) * 100));

  const isCancelled = state === "cancelled";
  const isExpired = state === "expired";
  const isUsed = state === "used";

  const defaultMeta =
    pass.purchased_at || pass.price != null ? (
      <>
        {pass.purchased_at && <>kupiony {formatDate(pass.purchased_at)}</>}
        {pass.price != null && (
          <>
            {pass.purchased_at ? " · " : ""}
            {pass.price} zł
          </>
        )}
        {pass.is_paid === false && <> · niezapłacony</>}
      </>
    ) : null;

  return (
    <div
      className={cn(
        "rounded-b2b border px-4 py-4",
        isCancelled ? "border-b2b-red-border bg-white" : "bg-white",
        isExpired && "bg-gray-50 opacity-80",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Entry count over duration — K3's left tile. It is the number the client
            actually asks about, so it gets the largest type on the card. */}
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg",
            state === "active" ? "bg-b2b-green-bg" : "bg-gray-100",
          )}
        >
          <span
            className={cn(
              "text-lg font-bold leading-none",
              state === "active" ? "text-b2b-green-text" : "text-gray-500",
            )}
          >
            {unlimited ? "∞" : total}
          </span>
          {pass.duration_days != null && (
            <span className="mt-0.5 text-[10px] leading-none text-gray-400">
              {pass.duration_days} dni
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 text-sm font-semibold",
                isExpired ? "text-gray-700" : "text-gray-900",
              )}
            >
              {pass_name}
            </p>
            {showState && <PassStateChip state={state} validUntil={valid_until} />}
          </div>
          {(meta ?? defaultMeta) && (
            <p className="mt-0.5 text-xs text-gray-500">{meta ?? defaultMeta}</p>
          )}
        </div>
      </div>

      {/* Cancelled and expired passes have no progress to show — an empty bar would
          suggest entries are still waiting to be used. */}
      {isCancelled ? (
        <p className="mt-3 text-xs text-b2b-red-text">
          Płatność nie doszła do skutku — karnet unieważniony
        </p>
      ) : isExpired ? (
        used < total &&
        !unlimited && (
          <p className="mt-3 text-xs text-gray-500">
            {wejscia(total - used)} {plural(total - used, "przepadło", "przepadły", "przepadło")}
          </p>
        )
      ) : (
        !unlimited && (
          <>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                // NOT `bg-brand-green-600` — that token does not exist (only
                // `brand-green` and `brand-green-700`), so the class resolved to
                // transparent and the fill was invisible on every pass card. Inherited
                // from PassWalletCard, where nothing ever caught it.
                className={cn("h-full rounded-full", isUsed ? "bg-gray-300" : "bg-b2b-green-text")}
                style={{ width: `${isUsed ? 100 : pct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              {isUsed ? (
                <span className="text-gray-400">0 z {wejscGenitive(total)}</span>
              ) : (
                <span className="font-semibold text-b2b-green-text">
                  Zostały {wejscia(left)} z {total}
                </span>
              )}
              {isUsed ? (
                <span className="text-gray-300">—</span>
              ) : (
                valid_until && (
                  <span className="text-gray-400">ważny do {formatDate(valid_until)}</span>
                )
              )}
            </div>
          </>
        )
      )}

      {!unlimited || isCancelled || isExpired ? null : (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-b2b-green-text">Bez limitu wejść</span>
          {valid_until && <span className="text-gray-400">ważny do {formatDate(valid_until)}</span>}
        </div>
      )}
    </div>
  );
}

/** The expired chip carries its date (K3: "Wygasł 20 maja") — "when" is the whole question. */
function PassStateChip({ state, validUntil }: { state: PassState; validUntil: string | null }) {
  if (state === "cancelled") return <StatusChip tone="rose">Anulowany</StatusChip>;
  if (state === "used") return <StatusChip tone="gray">Wykorzystany</StatusChip>;
  if (state === "expired") {
    return (
      <StatusChip tone="gray">
        {validUntil ? `Wygasł ${formatDate(validUntil)}` : "Wygasł"}
      </StatusChip>
    );
  }
  return <StatusChip tone="green">Aktywny</StatusChip>;
}

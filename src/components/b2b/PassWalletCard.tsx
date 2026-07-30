import { cn } from "@/lib/utils";

import { StatusChip } from "./StatusChip";

export type WalletState = "active" | "used" | "expired" | "cancelled";

export interface PassWallet {
  state: WalletState;
  pass_name: string;
  entries_total: number | null;
  entries_left: number | null;
  valid_until: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/**
 * The pass wallet card — four states (instructors-clients §6), built once and shared
 * between the Klienci client detail (T11) and the B2C profile wallet (T13). Remaining
 * entries always come from the server's ledger read, never a local counter.
 */
export function PassWalletCard({ wallet }: { wallet: PassWallet | null }) {
  if (!wallet) {
    return (
      <div className="rounded-xl border border-dashed bg-white px-4 py-4 text-center text-sm text-gray-400">
        Brak karnetu
      </div>
    );
  }

  const { state, pass_name, entries_total, entries_left } = wallet;
  const unlimited = entries_total === null;
  const total = entries_total ?? 0;
  const used = unlimited ? 0 : total - (entries_left ?? 0);
  const pct = unlimited || total === 0 ? 0 : Math.min(100, Math.round((used / total) * 100));

  if (state === "cancelled") {
    return (
      <div className="rounded-xl border bg-white px-4 py-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-900">{pass_name}</p>
          <StatusChip tone="rose">Anulowany</StatusChip>
        </div>
        <p className="text-xs text-gray-500">Zakup został anulowany — karnet nie jest aktywny.</p>
      </div>
    );
  }

  if (state === "expired") {
    const forfeited = unlimited ? null : Math.max(total - used, 0);
    return (
      <div className="rounded-xl border bg-gray-50 px-4 py-4 space-y-2 opacity-70">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-700">{pass_name}</p>
          <StatusChip tone="gray">Wygasł</StatusChip>
        </div>
        <p className="text-xs text-gray-500">
          {wallet.valid_until && <>wygasł {formatDate(wallet.valid_until)}</>}
          {forfeited != null && forfeited > 0 && (
            <>
              {wallet.valid_until ? " · " : ""}
              {forfeited} {forfeited === 1 ? "wejście" : "wejść"} przepadło
            </>
          )}
        </p>
      </div>
    );
  }

  // active | used
  const isUsed = state === "used";
  return (
    <div className="rounded-xl border bg-white px-4 py-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{pass_name}</p>
        {isUsed ? (
          <StatusChip tone="gray">Wykorzystany</StatusChip>
        ) : (
          <StatusChip tone="green">Aktywny</StatusChip>
        )}
      </div>

      {!unlimited && (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn("h-full rounded-full", isUsed ? "bg-gray-300" : "bg-brand-green-600")}
              style={{ width: `${isUsed ? 100 : pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={isUsed ? "text-gray-400" : "text-gray-600"}>
              {isUsed ? `0 z ${total}` : `Zostały ${entries_left} z ${total}`}
            </span>
            {wallet.valid_until && (
              <span className="text-gray-400">ważny do {formatDate(wallet.valid_until)}</span>
            )}
          </div>
        </>
      )}

      {unlimited && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Bez limitu wejść</span>
          {wallet.valid_until && (
            <span className="text-gray-400">ważny do {formatDate(wallet.valid_until)}</span>
          )}
        </div>
      )}
    </div>
  );
}

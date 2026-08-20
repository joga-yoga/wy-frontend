"use client";

import { Check, CreditCard, Search } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { HashedAvatar } from "@/components/common/HashedAvatar";
import { formatMoney } from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSetPageSubtitle } from "@/context/PageHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { personInitials, personLabel } from "@/lib/personDisplay";
import { cn } from "@/lib/utils";

import type { WalkInCandidate, WalkInSearchResponse } from "../types";

interface PassOption {
  id: string;
  name: string;
  price: number;
  currency: string | null;
  duration_days: number | null;
  session_count: number | null;
}

/**
 * Standalone pass sale (reception-desk §4) — reached from Recepcja's pinned footer
 * and from Klienci's client detail (T11), sharing this one implementation rather
 * than forking a second flow. Payment is cash-on-the-spot, identical to how a
 * buy-and-use booking is priced — no reception-specific payment logic.
 */
export default function SellPassPage() {
  const { studioId } = useParams<{ studioId: string }>();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const presetUserId = searchParams.get("userId");
  const presetEmail = searchParams.get("email");

  const [candidate, setCandidate] = useState<WalkInCandidate | null>(
    presetUserId
      ? { user_id: presetUserId, email: presetEmail ?? "", name: null, pass_context: null }
      : null,
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WalkInSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [passes, setPasses] = useState<PassOption[]>([]);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sold, setSold] = useState<{ pass_name: string; price: number } | null>(null);

  useEffect(() => {
    axiosInstance
      .get<{ passes: PassOption[] }>(`/studios/${studioId}`)
      .then((r) => {
        setPasses(r.data.passes ?? []);
        if ((r.data.passes ?? []).length > 0) setSelectedPassId(r.data.passes[0].id);
      })
      .catch(() => setPasses([]));
  }, [studioId]);

  useEffect(() => {
    if (candidate || query.trim().length < 2) {
      setResults(null);
      return;
    }
    setIsSearching(true);
    const handle = setTimeout(() => {
      axiosInstance
        .get<WalkInSearchResponse>(`/studios/${studioId}/front-desk/search-users`, {
          params: { q: query },
        })
        .then((r) => setResults(r.data))
        .catch(() => setResults(null))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [candidate, query, studioId]);

  async function handleSell() {
    if (!candidate || !selectedPassId) return;
    setIsSubmitting(true);
    try {
      const { data } = await axiosInstance.post<{ pass_name: string; price: number }>(
        `/studios/${studioId}/passes/${selectedPassId}/sell`,
        { user_id: candidate.user_id, pass_id: selectedPassId },
      );
      setSold(data);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ description: detail || "Nie udało się sprzedać karnetu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Arriving from Klienci we only get `?userId=`, so look the person up rather than showing a
  // placeholder — the header subtitle puts this name in front of the desk while they take money.
  useEffect(() => {
    if (!presetUserId || presetEmail) return;
    axiosInstance
      .get<{ email: string; name?: string | null }>(`/studios/${studioId}/clients/${presetUserId}`)
      .then(({ data }) =>
        setCandidate((prev) =>
          prev ? { ...prev, email: data.email, name: data.name ?? null } : prev,
        ),
      )
      .catch(() => {});
  }, [presetUserId, presetEmail, studioId]);

  const selectedPass = passes.find((p) => p.id === selectedPassId) ?? null;

  // T7 puts the client in the header subtitle rather than a line in the body.
  useSetPageSubtitle(
    candidate?.email || candidate?.name
      ? personLabel(candidate.name, candidate.email).primary
      : null,
  );

  if (sold) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-b2b-green-bg text-b2b-green-text">
          <Check size={34} strokeWidth={2.5} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900">Sprzedano karnet</h2>
          <p className="text-sm text-gray-500">
            {sold.pass_name} · {formatMoney(sold.price)} · gotówka na miejscu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-5">
      {!candidate ? (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Imię, nazwisko lub email klienta"
              className="pl-9"
            />
          </div>
          {isSearching && <p className="text-xs text-gray-400">Szukam...</p>}
          {results && results.studio_clients.length > 0 && (
            <div className="rounded-b2b border bg-white overflow-hidden divide-y">
              {results.studio_clients.map((c) => (
                <button
                  key={c.user_id}
                  onClick={() => setCandidate(c)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <HashedAvatar
                    seed={c.user_id}
                    name={personLabel(c.name, c.email).primary}
                    initialsOverride={personInitials(c.name, c.email)}
                    size={36}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {personLabel(c.name, c.email).primary}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {c.pass_context ?? personLabel(c.name, c.email).secondary ?? ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {passes.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPassId(p.id)}
                aria-pressed={selectedPassId === p.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-b2b border bg-white px-4 py-3.5 text-left transition-colors",
                  selectedPassId === p.id
                    ? "border-b2b-green-text ring-1 ring-b2b-green-text"
                    : "border-gray-200",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selectedPassId === p.id ? "border-b2b-green-text" : "border-gray-300",
                  )}
                >
                  {selectedPassId === p.id && (
                    <span className="h-2.5 w-2.5 rounded-full bg-b2b-green-text" />
                  )}
                </span>
                {/* Entry count as the leading badge (T7) — it is what distinguishes the passes. */}
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-100">
                  <span className="text-sm font-bold leading-none text-gray-900">
                    {p.session_count ?? "∞"}
                  </span>
                  {p.duration_days ? (
                    <span className="mt-0.5 text-[10px] leading-none text-gray-500">
                      {p.duration_days} dni
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.price.toLocaleString("pl-PL")} {getCurrencySymbol(p.currency || "PLN")}
                    {/* Per-entry price makes the passes comparable at a glance (T7). */}
                    {p.session_count
                      ? ` · ${(p.price / p.session_count).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} ${getCurrencySymbol(p.currency || "PLN")}/wejście`
                      : " · bez limitu wejść"}
                  </p>
                </div>
              </button>
            ))}
            {passes.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">
                Studio nie ma jeszcze żadnych karnetów.
              </p>
            )}
          </div>

          {selectedPass && (
            <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
              <CreditCard size={15} className="mt-0.5 shrink-0 text-gray-400" />
              <p className="text-[13px] leading-snug text-gray-600">
                Gotówka na miejscu ·{" "}
                <span className="font-semibold text-gray-900">
                  {selectedPass.price.toLocaleString("pl-PL")}{" "}
                  {getCurrencySymbol(selectedPass.currency || "PLN")}
                </span>{" "}
                · karnet aktywny od razu
              </p>
            </div>
          )}

          <Button
            size="action"
            variant="green"
            className="w-full"
            disabled={!selectedPassId || isSubmitting}
            onClick={handleSell}
          >
            {isSubmitting
              ? "Sprzedaję..."
              : selectedPass
                ? `Sprzedaj karnet · ${formatMoney(selectedPass.price)}`
                : "Sprzedaj karnet"}
          </Button>
        </>
      )}
    </div>
  );
}

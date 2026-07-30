"use client";

import { Search } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
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
      ? { user_id: presetUserId, email: presetEmail ?? "Klient", name: null, pass_context: null }
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

  const selectedPass = passes.find((p) => p.id === selectedPassId) ?? null;

  if (sold) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center space-y-3">
        <h1 className="text-lg font-semibold text-gray-900">Sprzedano karnet</h1>
        <p className="text-sm text-gray-500">
          {sold.pass_name} · {sold.price.toLocaleString("pl-PL")} zł · gotówka na miejscu
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">Sprzedaj karnet</h1>

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
          {results && (results.studio_clients.length > 0 || results.other_accounts.length > 0) && (
            <div className="rounded-xl border bg-white overflow-hidden divide-y">
              {[...results.studio_clients, ...results.other_accounts].map((c) => (
                <button
                  key={c.user_id}
                  onClick={() => setCandidate(c)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                >
                  <p className="truncate text-sm font-medium text-gray-900">{c.name || c.email}</p>
                  {c.pass_context && (
                    <span className="shrink-0 text-xs text-gray-500">{c.pass_context}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {!presetUserId && (
            <p className="text-sm text-gray-500">
              Klient: <span className="font-medium text-gray-900">{candidate.email}</span>
            </p>
          )}

          <div className="space-y-2">
            {passes.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPassId(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left",
                  selectedPassId === p.id ? "border-brand-green bg-emerald-50/40" : "bg-white",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                  {p.session_count ?? "∞"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.duration_days ? `${p.duration_days} dni · ` : ""}
                    {p.price.toLocaleString("pl-PL")} {getCurrencySymbol(p.currency || "PLN")}
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
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Gotówka na miejscu · {selectedPass.price.toLocaleString("pl-PL")}{" "}
              {getCurrencySymbol(selectedPass.currency || "PLN")} · karnet aktywny od razu
            </div>
          )}

          <Button
            variant="green"
            className="w-full"
            disabled={!selectedPassId || isSubmitting}
            onClick={handleSell}
          >
            {isSubmitting
              ? "Sprzedaję..."
              : selectedPass
                ? `Sprzedaj karnet · ${selectedPass.price.toLocaleString("pl-PL")} zł`
                : "Sprzedaj karnet"}
          </Button>
        </>
      )}
    </div>
  );
}

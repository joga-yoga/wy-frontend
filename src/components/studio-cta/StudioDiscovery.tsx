"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";

export type StudioIdentity = { kind: "studio" | "directory"; id: string };
export type StudioCandidate = StudioIdentity & {
  name: string;
  city: string | null;
  address: string | null;
  action: "claim" | "edit" | "managed";
};

export function StudioDiscovery() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudioCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setResults([]);
    setError("");
    if (query.trim().length < 3) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      axiosInstance
        .get<StudioCandidate[]>("/studio-setup/search", {
          params: { q: query.trim() },
          signal: controller.signal,
        })
        .then(({ data }) => {
          if (!controller.signal.aborted) setResults(data);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError("Nie udało się wyszukać studia. Spróbuj ponownie.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  async function select(item: StudioCandidate) {
    if (item.action === "edit") {
      router.push(`/account/partner/studio/${item.id}/edit`);
      return;
    }
    setBusy(true);
    try {
      const { data } = await axiosInstance.post<{ public_token: string }>("/studio-setup/drafts", {
        kind: item.kind,
        id: item.id,
      });
      router.push(`/account/partner/studio/create?draft=${encodeURIComponent(data.public_token)}`);
    } catch {
      setError("Nie udało się przygotować szkicu. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="rounded-2xl bg-zinc-50 p-6 text-left text-zinc-700"
      aria-label="Znajdź swoje studio"
    >
      <h2 className="text-2xl font-semibold">Znajdź swoje studio</h2>
      <p className="my-3 text-sm">Sprawdź, czy profil Twojego studia już tu jest.</p>
      <label className="text-sm">
        Nazwa studia
        <Input value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      </label>
      <div aria-live="polite" className="my-3 text-sm">
        {query.trim().length < 3
          ? "Wpisz co najmniej 3 znaki."
          : loading
            ? "Szukamy studia…"
            : error || (results.length === 0 ? "Nie znaleziono studia" : "")}
      </div>
      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {results.map((item) => (
          <li key={`${item.kind}:${item.id}`} className="rounded border p-3">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm">{[item.city, item.address].filter(Boolean).join(" · ")}</p>
            {item.action === "managed" ? (
              <p className="text-sm">Profil jest już zarządzany</p>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void select(item)}
              >
                {item.action === "edit" ? "Edytuj studio" : "To moje studio"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3 text-sm underline">
        <Link
          href={`/account/partner/studio/create?step=manual&name=${encodeURIComponent(query.trim())}`}
        >
          Dodaj studio ręcznie
        </Link>
        <Link
          href={`/account/partner/studio/import/fitssey?name=${encodeURIComponent(query.trim())}`}
        >
          Przenieś dane z Fitssey
        </Link>
      </div>
    </section>
  );
}

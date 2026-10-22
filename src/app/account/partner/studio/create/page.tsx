"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { axiosInstance } from "@/lib/axiosInstance";
import type { GeneratedStudioProfileDraft, StudioPublicSearchItem } from "@/types/studio";

import { StudioForm } from "../[studioId]/edit/StudioForm";
import { ImportEntry } from "../import/fitssey/ImportEntry";

export default function CreateStudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { capabilities, isLoading } = usePartnerCapabilities();
  const manual = searchParams.get("step") === "manual";
  const [manualOpened, setManualOpened] = useState(manual);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudioPublicSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [alternatives, setAlternatives] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (manual) setManualOpened(true);
  }, [manual]);

  useEffect(() => {
    setResults([]);
    setSearched(false);
    setError("");
    if (query.trim().length < 3) {
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(() => {
      axiosInstance
        .get<StudioPublicSearchItem[]>("/public/studios/search", {
          params: { q: query.trim(), limit: 10 },
          signal: controller.signal,
        })
        .then(({ data }) => {
          if (!controller.signal.aborted) {
            setResults(data);
            setSearched(true);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError("Nie udało się wyszukać studia. Spróbuj ponownie.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  async function manage(studio: StudioPublicSearchItem) {
    if (capabilities?.managedStudios.some((item) => item.id === studio.id)) {
      router.push(`/account/partner/menu/studio/${studio.id}`);
      return;
    }
    if (studio.is_claimed || busyId) return;
    setBusyId(studio.id);
    setError("");
    try {
      // Existing snapshot/preview/claim path retains its ownership and mode confirmation.
      const { data } = await axiosInstance.post<GeneratedStudioProfileDraft>(
        "/studio-profile-drafts/generate",
        { input: studio.name, existing_studio_id: studio.id },
      );
      router.push(`/studio/dodaj/preview/${data.public_token}`);
    } catch {
      setError("Nie udało się otworzyć profilu. Spróbuj ponownie.");
    } finally {
      setBusyId(null);
    }
  }
  if (isLoading) return <p className="p-4">Ładowanie…</p>;
  if (capabilities?.businessMode === "solo")
    return (
      <div className="p-4">
        <Link href="/account/partner/menu">Przejdź do zarządzania własnymi zajęciami</Link>
      </div>
    );
  return (
    <>
      <section hidden={manual} className="mx-auto max-w-lg space-y-5 px-4 py-6 pb-28">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Znajdź swoje studio</h1>
          <p className="text-sm text-gray-500">Sprawdź, czy profil studia już tu jest.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="studio-search" className="font-medium">
            Nazwa studia
          </label>
          <Input
            id="studio-search"
            value={query}
            autoComplete="off"
            placeholder="np. Święta Krowa Studio Jogi"
            onChange={(event) => {
              setQuery(event.target.value);
              setAlternatives(false);
            }}
          />
          <p className="text-sm text-gray-500">Wpisz co najmniej 3 znaki.</p>
        </div>
        <div aria-live="polite">
          {searching && <p className="text-sm text-gray-500">Szukamy studiów…</p>}
          {searched && results.length === 0 && <p>Nie znaleziono studia o tej nazwie.</p>}
        </div>
        {results.length > 0 && (
          <ul className="divide-y overflow-hidden rounded-xl border bg-white">
            {results.map((studio) => {
              const managed = capabilities?.managedStudios.some((item) => item.id === studio.id);
              return (
                <li key={studio.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{studio.name}</p>
                    <p className="text-xs text-gray-500">
                      {[studio.address, studio.city].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={Boolean(busyId) || (studio.is_claimed && !managed)}
                    onClick={() => void manage(studio)}
                  >
                    {busyId === studio.id
                      ? "Otwieranie…"
                      : studio.is_claimed && !managed
                        ? "Już zarządzane"
                        : "Zarządzaj"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {searched && (
          <Button variant="outline" onClick={() => setAlternatives(true)}>
            Nie ma tu mojego studia
          </Button>
        )}
        {alternatives && (
          <div className="space-y-4 border-t pt-4">
            <h2 className="text-lg font-semibold">Jak chcesz dodać studio?</h2>
            <ImportEntry />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setManualOpened(true);
                router.push("/account/partner/studio/create?step=manual");
              }}
            >
              Utwórz studio ręcznie
            </Button>
          </div>
        )}
      </section>
      {manualOpened && (
        <div hidden={!manual}>
          <div className="mx-auto max-w-5xl px-4 pt-4">
            <Button variant="ghost" onClick={() => router.push("/account/partner/studio/create")}>
              Wróć do wyszukiwania
            </Button>
          </div>
          <StudioForm routeId="create" initialName={query.trim()} />
        </div>
      )}
    </>
  );
}

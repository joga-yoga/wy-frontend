"use client";

import { Building2, Check, Loader2, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface StudioAutocomplete {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  address?: string | null;
  status: string;
}

interface StudioLinkSectionProps {
  instructorId: string;
}

type Mode =
  | "idle"
  | "search"
  | "not-found"
  | "role"
  | "create-owner"
  | "create-external"
  | "success";

export function StudioLinkSection({ instructorId }: StudioLinkSectionProps) {
  const { toast } = useToast();
  const [linkedStudios, setLinkedStudios] = useState<StudioAutocomplete[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [mode, setMode] = useState<Mode>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudioAutocomplete[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Minimal create fields
  const [createName, setCreateName] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdStudioId, setCreatedStudioId] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get<StudioAutocomplete[]>(`/instructors/${instructorId}/studios`)
      .then(({ data }) => setLinkedStudios(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [instructorId]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await axiosInstance.get<StudioAutocomplete[]>(
        `/studios/search?q=${encodeURIComponent(q)}`,
      );
      const linkedIds = new Set(linkedStudios.map((s) => s.id));
      setSearchResults(data.filter((s) => !linkedIds.has(s.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function linkStudio(studio: StudioAutocomplete) {
    try {
      await axiosInstance.post(`/studios/${studio.id}/instructors/${instructorId}`);
      setLinkedStudios((prev) => [...prev, studio]);
      setMode("idle");
      setSearchQuery("");
      setSearchResults([]);
      toast({ description: `Połączono ze studiem ${studio.name}.` });
    } catch {
      toast({ description: "Nie udało się połączyć ze studiem.", variant: "destructive" });
    }
  }

  async function unlinkStudio(studioId: string) {
    try {
      await axiosInstance.delete(`/studios/${studioId}/instructors/${instructorId}`);
      setLinkedStudios((prev) => prev.filter((s) => s.id !== studioId));
      toast({ description: "Usunięto połączenie ze studiem." });
    } catch {
      toast({ description: "Nie udało się usunąć połączenia.", variant: "destructive" });
    }
  }

  async function handleCreateOwner() {
    if (!createName.trim()) return;
    setIsCreating(true);
    try {
      const { data } = await axiosInstance.post("/studios/minimal", {
        name: createName.trim(),
        address: createAddress.trim() || null,
      });
      await axiosInstance.post(`/studios/${data.id}/instructors/${instructorId}`);
      setLinkedStudios((prev) => [
        ...prev,
        { id: data.id, name: data.name, slug: data.slug, status: data.status },
      ]);
      setCreatedStudioId(data.id);
      setMode("success");
    } catch (err: any) {
      toast({
        description: err.response?.data?.detail || "Nie udało się utworzyć studia.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCreateExternal() {
    if (!createName.trim() || !createEmail.trim()) return;
    setIsCreating(true);
    try {
      const { data } = await axiosInstance.post("/studios/minimal", {
        name: createName.trim(),
        address: createAddress.trim() || null,
        owner_email: createEmail.trim(),
      });
      await axiosInstance.post(`/studios/${data.id}/instructors/${instructorId}`);
      setLinkedStudios((prev) => [
        ...prev,
        { id: data.id, name: data.name, slug: data.slug, status: data.status },
      ]);
      setMode("idle");
      toast({ description: `Studio utworzone. Zaproszenie wysłano na ${createEmail.trim()}.` });
    } catch (err: any) {
      toast({
        description: err.response?.data?.detail || "Nie udało się utworzyć studia.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }

  function resetCreate() {
    setCreateName("");
    setCreateAddress("");
    setCreateEmail("");
    setCreatedStudioId(null);
  }

  if (isLoading) return null;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Gdzie prowadzisz zajęcia?</label>
      <p className="text-sm text-muted-foreground">
        Połącz profil instruktora ze studiami, w których prowadzisz zajęcia
      </p>

      {/* Linked studios */}
      {linkedStudios.map((studio) => (
        <div
          key={studio.id}
          className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3"
        >
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {studio.image_id ? (
              <WyImage
                src={studio.image_id}
                alt={studio.name}
                width={36}
                height={36}
                className="size-9 rounded-lg object-contain"
              />
            ) : (
              <Building2 className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{studio.name}</p>
            {studio.address && (
              <p className="truncate text-xs text-muted-foreground">{studio.address}</p>
            )}
            {studio.status === "stub" && (
              <span className="text-xs text-amber-600">zaproszenie wysłane · oczekuje</span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={() => unlinkStudio(studio.id)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}

      {/* Idle / Search mode */}
      {mode === "idle" && (
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-brand-blue"
          onClick={() => setMode("search")}
        >
          <Plus className="size-4" />
          Dodaj studio
        </button>
      )}

      {mode === "search" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Wyszukaj studio po nazwie..."
              className="h-10 pl-9 text-sm"
              autoFocus
            />
          </div>
          {isSearching && (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="space-y-1 rounded-lg border p-1">
              {searchResults.map((studio) => (
                <button
                  key={studio.id}
                  type="button"
                  onClick={() => linkStudio(studio)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {studio.image_id ? (
                      <WyImage
                        src={studio.image_id}
                        alt={studio.name}
                        width={32}
                        height={32}
                        className="size-8 rounded-lg object-contain"
                      />
                    ) : (
                      <Building2 className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm">{studio.name}</span>
                    {studio.address && (
                      <p className="truncate text-xs text-muted-foreground">{studio.address}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">Brak wyników.</p>
          )}
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-brand-blue"
            onClick={() => {
              setCreateName(searchQuery);
              setMode("not-found");
            }}
          >
            <Plus className="size-4" />
            Nie ma mojego studia — dodaj
          </button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMode("idle");
              setSearchQuery("");
              setSearchResults([]);
            }}
          >
            Anuluj
          </button>
        </div>
      )}

      {/* Role question */}
      {(mode === "not-found" || mode === "role") && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-semibold">Powiedz, kim jesteś:</p>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left hover:bg-muted transition-colors"
            onClick={() => {
              resetCreate();
              setCreateName(searchQuery || createName);
              setMode("create-owner");
            }}
          >
            <div>
              <p className="text-sm font-medium">Jestem właścicielem / managerem</p>
              <p className="text-xs text-muted-foreground">Chcę zarządzać profilem studia</p>
            </div>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left hover:bg-muted transition-colors"
            onClick={() => {
              resetCreate();
              setCreateName(searchQuery || createName);
              setMode("create-external");
            }}
          >
            <div>
              <p className="text-sm font-medium">Tylko tu prowadzę zajęcia</p>
              <p className="text-xs text-muted-foreground">Wyślemy zaproszenie do właściciela</p>
            </div>
          </button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode("search")}
          >
            Wróć do wyszukiwania
          </button>
        </div>
      )}

      {/* Owner/manager create */}
      {mode === "create-owner" && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-semibold">Nowe studio (jako właściciel)</p>
          <div>
            <label className="mb-1 block text-xs font-medium">Nazwa studia *</label>
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="np. Yoga Space"
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Adres (opcjonalnie)</label>
            <Input
              value={createAddress}
              onChange={(e) => setCreateAddress(e.target.value)}
              placeholder="np. ul. Marszałkowska 1, Warszawa"
              className="h-10 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateOwner}
              disabled={isCreating || !createName.trim()}
            >
              {isCreating ? "Tworzę..." : "Utwórz studio"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setMode("role")}>
              Wróć
            </Button>
          </div>
        </div>
      )}

      {/* External (only teaches there) create */}
      {mode === "create-external" && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-semibold">Nowe studio (wyślij zaproszenie)</p>
          <div>
            <label className="mb-1 block text-xs font-medium">Nazwa studia *</label>
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="np. Yoga Space"
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Adres (opcjonalnie)</label>
            <Input
              value={createAddress}
              onChange={(e) => setCreateAddress(e.target.value)}
              placeholder="np. ul. Marszałkowska 1, Warszawa"
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">E-mail właściciela *</label>
            <Input
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              type="email"
              placeholder="wlasciciel@studio.pl"
              className="h-10 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateExternal}
              disabled={isCreating || !createName.trim() || !createEmail.trim()}
            >
              {isCreating ? "Tworzę..." : "Utwórz i wyślij zaproszenie"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setMode("role")}>
              Wróć
            </Button>
          </div>
        </div>
      )}

      {/* Success state */}
      {mode === "success" && createdStudioId && (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <Check className="size-5 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">Studio utworzone!</p>
          </div>
          <p className="text-sm text-emerald-700">Szczegóły uzupełnisz w Oferta → Studio.</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setMode("idle");
                resetCreate();
              }}
            >
              Wróć do profilu instruktora
            </Button>
            <Button type="button" size="sm" asChild>
              <Link href={`/profile/studio/${createdStudioId}/edit`}>Uzupełnij studio teraz</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

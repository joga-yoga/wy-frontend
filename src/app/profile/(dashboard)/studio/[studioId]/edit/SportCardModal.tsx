"use client";

import { ArrowLeft, Check, CreditCard, Plus, Search } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

import type { SportCard, StudioSportCard } from "./types";

interface SportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (sc: StudioSportCard) => void;
  studioId: string | null;
  currency: string;
}

function blockInvalidNumberChars(event: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
}

function fieldClass() {
  return "h-12 rounded-md bg-white px-3 text-base shadow-none focus-visible:ring-brand-green";
}

type Step = "pick" | "predefined" | "custom";

export function SportCardModal({
  isOpen,
  onClose,
  onSaved,
  studioId,
  currency,
}: SportCardModalProps) {
  const [step, setStep] = useState<Step>("pick");
  const [catalogue, setCatalogue] = useState<SportCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<SportCard | null>(null);

  // Predefined card fee
  const [hasFee, setHasFee] = useState(false);
  const [fee, setFee] = useState<string>("");

  // Custom card
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [customPhotoPreviewUrl, setCustomPhotoPreviewUrl] = useState<string | null>(null);
  const [customHasFee, setCustomHasFee] = useState(false);
  const [customFee, setCustomFee] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("pick");
    setSearchQuery("");
    setSelectedCard(null);
    setHasFee(false);
    setFee("");
    setCustomName("");
    setCustomDescription("");
    setCustomPhoto(null);
    setCustomPhotoPreviewUrl(null);
    setCustomHasFee(false);
    setCustomFee("");
    setError(null);

    axiosInstance
      .get<SportCard[]>("/sport-cards")
      .then(({ data }) => setCatalogue(data))
      .catch(() => {});
  }, [isOpen]);

  const filteredCards = searchQuery
    ? catalogue.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : catalogue;

  function handlePickCard(card: SportCard) {
    setSelectedCard(card);
    setStep("predefined");
  }

  async function handlePhotoFileSelect(file: File) {
    const previewUrl = URL.createObjectURL(file);
    setCustomPhotoPreviewUrl(previewUrl);
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axiosInstance.post<{ image_id: string }>(
        "/events/image-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setCustomPhoto(response.data.image_id);
    } catch {
      setError("Nie udało się przesłać zdjęcia.");
      setCustomPhotoPreviewUrl(null);
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSavePredefined() {
    if (!selectedCard) return;
    setError(null);
    setIsSaving(true);
    const payload = {
      sport_card_id: selectedCard.id,
      fee: hasFee && fee ? Number(fee) : null,
    };
    try {
      if (studioId) {
        const { data } = await axiosInstance.post(`/studios/${studioId}/sport-cards`, payload);
        onSaved(data);
      } else {
        onSaved({
          sport_card_id: selectedCard.id,
          name: selectedCard.name,
          sport_card: selectedCard,
          fee: payload.fee,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Nie udało się dodać karty sportowej.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveCustom() {
    if (!customName.trim()) {
      setError("Nazwa karty jest wymagana.");
      return;
    }
    setError(null);
    setIsSaving(true);
    const payload = {
      sport_card_id: null,
      name: customName.trim(),
      description: customDescription.trim() || null,
      photo: customPhoto,
      fee: customHasFee && customFee ? Number(customFee) : null,
    };
    try {
      if (studioId) {
        const { data } = await axiosInstance.post(`/studios/${studioId}/sport-cards`, payload);
        onSaved(data);
      } else {
        onSaved(payload as StudioSportCard);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Nie udało się dodać karty sportowej.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {step === "pick" && "Dodaj kartę sportową"}
            {step === "predefined" && selectedCard?.name}
            {step === "custom" && "Własna karta sportowa"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4 max-h-[60vh]">
          {/* Step 1: Pick from catalogue */}
          {step === "pick" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Szukaj karty..."
                  className="h-10 pl-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                {filteredCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handlePickCard(card)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted transition-colors"
                  >
                    {card.photo ? (
                      <WyImage
                        src={card.photo}
                        alt={card.name}
                        width={32}
                        height={32}
                        className="size-8 rounded object-contain"
                      />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded bg-muted">
                        <CreditCard className="size-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{card.name}</p>
                      {card.description && (
                        <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep("custom")}
                className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed px-3 py-3 text-sm font-medium text-muted-foreground hover:border-brand-green hover:text-brand-green transition-colors"
              >
                <Plus className="size-4" />
                Utwórz własną kartę
              </button>
            </div>
          )}

          {/* Step 2a: Predefined card — fee toggle */}
          {step === "predefined" && selectedCard && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
                {selectedCard.photo ? (
                  <WyImage
                    src={selectedCard.photo}
                    alt={selectedCard.name}
                    width={40}
                    height={40}
                    className="size-10 rounded object-contain"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded bg-muted">
                    <CreditCard className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{selectedCard.name}</p>
                  {selectedCard.description && (
                    <p className="text-xs text-muted-foreground">{selectedCard.description}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Dopłata za wejście</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    className={cn(
                      "min-h-10 rounded-lg border text-sm",
                      !hasFee
                        ? "border-brand-green font-semibold text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                    onClick={() => {
                      setHasFee(false);
                      setFee("");
                    }}
                  >
                    Bez dopłaty
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "min-h-10 rounded-lg border text-sm",
                      hasFee
                        ? "border-brand-green font-semibold text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                    onClick={() => setHasFee(true)}
                  >
                    Dopłata
                  </button>
                </div>
                {!hasFee && (
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 border px-3 py-2 text-sm text-muted-foreground">
                    <Check className="size-4 shrink-0 text-brand-green" />
                    Uczestnicy z {selectedCard.name} wchodzą bez dodatkowej opłaty.
                  </div>
                )}
                {hasFee && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      onKeyDown={blockInvalidNumberChars}
                      className={fieldClass()}
                      placeholder="0.00"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">
                      {currency}/wejście
                    </span>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {/* Step 2b: Custom card */}
          {step === "custom" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Nazwa</label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={fieldClass()}
                  placeholder="np. OK System"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Opis · opcjonalnie</label>
                <Textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={2}
                  className="text-sm"
                  placeholder="Krótki opis karty"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Zdjęcie · opcjonalnie</label>
                <SingleImageUpload
                  existingImageId={customPhoto}
                  imagePreviewUrl={customPhotoPreviewUrl}
                  isUploading={isUploadingPhoto}
                  onFileSelect={handlePhotoFileSelect}
                  onRemove={() => { setCustomPhoto(null); setCustomPhotoPreviewUrl(null); }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Dopłata za wejście</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    className={cn(
                      "min-h-10 rounded-lg border text-sm",
                      !customHasFee
                        ? "border-brand-green font-semibold text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                    onClick={() => {
                      setCustomHasFee(false);
                      setCustomFee("");
                    }}
                  >
                    Bez dopłaty
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "min-h-10 rounded-lg border text-sm",
                      customHasFee
                        ? "border-brand-green font-semibold text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                    onClick={() => setCustomHasFee(true)}
                  >
                    Dopłata
                  </button>
                </div>
                {customHasFee && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={customFee}
                      onChange={(e) => setCustomFee(e.target.value)}
                      onKeyDown={blockInvalidNumberChars}
                      className={fieldClass()}
                      placeholder="0.00"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">
                      {currency === "PLN" ? "zł" : currency} / wejście
                    </span>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>

        <DrawerFooter className={step === "pick" ? "" : "flex-row gap-2"}>
          {step === "pick" && (
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Anuluj</Button>
            </DrawerClose>
          )}
          {step === "predefined" && (
            <>
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => setStep("pick")}>
                <ArrowLeft className="size-5" />
              </Button>
              <Button onClick={handleSavePredefined} disabled={isSaving} className="flex-1">
                {isSaving ? "Zapisuję..." : "Dodaj kartę"}
              </Button>
            </>
          )}
          {step === "custom" && (
            <>
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => setStep("pick")}>
                <ArrowLeft className="size-5" />
              </Button>
              <Button onClick={handleSaveCustom} disabled={isSaving} className="flex-1">
                {isSaving ? "Zapisuję..." : "Zapisz kartę"}
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
